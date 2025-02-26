// deno-lint-ignore-file no-unused-vars
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono, z } from "@hono/zod-openapi";
import { intersect } from "@std/collections";
import { SECOND } from "@std/datetime";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import {
  AUTH_COOKIE_NAME,
  GOOGLE_EMAIL_SCOPE,
  GOOGLE_GDRIVE_SCOPES,
  GOOGLE_OPEN_ID_SCOPE,
} from "./const.ts";
import { Env } from "./env.ts";
import {
  google_process_cb_data,
  google_sign_in_url,
} from "./google.service.ts";
import { __drop__all__data__in__kv__, db } from "./kv.ts";
import {
  mdw_authentication,
  mdw_cors,
  mdw_ui_redirect_catch_all,
} from "./mdw.ts";

const app = new OpenAPIHono();

let i = 0;
const debug = (...args: unknown[]) => {
  console.warn("debug:", ++i, ...args);
};

debug(1);
app.use(mdw_cors());
debug(2);

(app as OpenAPIHono<mdw_ui_redirect_catch_all & mdw_authentication>)
  .openapi({
    path: Env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN,
    method: "get",
    middleware: [
      mdw_ui_redirect_catch_all,
      /// @ts-ignore
      mdw_authentication,
    ],
    responses: {
      200: {
        description: "Authenticate user. Obtain email.",
      },
    },
  }, async (c) => {
    debug(3);

    if (c.var.auth.as === "user") {
      debug(4);

      throw new HTTPException(400, {
        message: `User is already authenticated as ${c.var.auth.session.email}`,
      });
    }
    debug(5);

    const id = crypto.randomUUID();
    const redirect = google_sign_in_url({
      scope: [GOOGLE_EMAIL_SCOPE, GOOGLE_OPEN_ID_SCOPE],
      state: id,
    });
    debug(6);

    const saveGhostRes = await db.ghost.add({ id, email: null, access_token: null }, {
      expireIn: SECOND * 30,
    });
    const ghost = await db.ghost.findByPrimaryIndex('id', id);
    console.log(ghost);
    debug(7, saveGhostRes, redirect);

    return c.newResponse(null, {
      headers: {
        Location: redirect,
      }
    });
  });
app
  .openapi({
    path: Env.API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE,
    method: "get",
    responses: {
      200: {
        description:
          "Authorize user. Ask to grant access to user's google-drive.",
      },
    },
  }, (c) => {
    debug(8);

    const state: {
      auth_cookie: string | undefined;
    } = {
      auth_cookie: getCookie(c, AUTH_COOKIE_NAME),
    };
    debug(9);

    return c.redirect(
      `${Env.API_URL}/${Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE}`,
    );
  });
(app as OpenAPIHono<mdw_ui_redirect_catch_all>)
  .openapi({
    path: Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    method: "get",
    request: {
      query: z.object({
        code: z.string().optional(),
        state: z.string().optional(),
        error: z.string().optional(),
      }, {
        message:
          "Fail to validate google request to application's callback endpoint",
      }),
    },
    middleware: [mdw_ui_redirect_catch_all],
    responses: {
      200: {
        description:
          "This endpoint should not be used directly. The google use it.",
      },
    },
  }, async (c) => {
    debug(10);

    const { code, error, state } = c.req.valid("query");
    debug();

    if (error || !code || !state) {
      debug(11);

      throw new HTTPException(500, {
        message:
          `Fail to process google cb... <code> ${code}, <state> ${state}`,
        cause: error,
      });
    }
    debug(12);

    const { info, payload } = await google_process_cb_data(code);
    debug(13);

    const email = info.email;
    const is_g_drive_scopes_present =
      intersect(info.scopes, GOOGLE_GDRIVE_SCOPES).length > 0;
    debug(14);

    if (!email && !is_g_drive_scopes_present) {
      debug(15);

      deleteCookie(c, AUTH_COOKIE_NAME);
      debug(16);

      throw new HTTPException(500, {
        message: "Fail to process google cb",
        cause: "Missing email and g_drive scopes",
      });
    }
    debug(17);

    const bucket = email
      ? await db.bucket.findByPrimaryIndex("email", email).then((
        r,
      ) => r?.value)
      : null;
    debug(18);

    if (!is_g_drive_scopes_present && !bucket) {
      debug(19);

      await db.ghost.deleteByPrimaryIndex(
        "id",
        state,
        {
          consistency: "eventual",
        },
      );
      debug(20);

      const id = crypto.randomUUID();
      await db.ghost.add({
        id,
        access_token: payload.tokens.access_token || null,
        email: email!, /// ((!email && !is_gdrive) || !is_gdrive) => email!
      });
      debug(21);

      const redirect_for_g_drive = google_sign_in_url({
        scope: GOOGLE_GDRIVE_SCOPES,
        state: id,
        include_granted_scopes: true,
        login_hint: email!,
      });
      debug(22);

      return c.newResponse(null, {
        status: 302,
        headers: {
          Location: redirect_for_g_drive,
          ...(payload.tokens.access_token &&
            { "Authorization": `Bearer ${payload.tokens.access_token}` }),
        },
      }
      );
    }
    debug(23);

    const {
      access_token,
      refresh_token = bucket?.google_drive_authorization.refresh_token,
    } = payload.tokens;
    debug(24);

    if (!refresh_token) {
      debug(25);

      deleteCookie(c, AUTH_COOKIE_NAME);
      debug(26);

      throw new HTTPException(500, { message: "Missing google refresh token" });
    }
    debug(27);

    const ghost = await db.ghost.findByPrimaryIndex("id", state).then((r) =>
      r?.value || null
    );
    debug(28);

    if (!ghost) {
      throw new HTTPException(500, {
        message: "Missing state of candidate to authorize",
      });
    } else if (!ghost.email && !email) {
      throw new HTTPException(500, {
        message: "Missing email in google cb and ghost",
      });
    }
    debug(29);

    // TODO: check from here
    const _email = email || ghost.email!;
    const session_id = crypto.randomUUID();
    debug(30);

    setCookie(c, AUTH_COOKIE_NAME, session_id, {
      domain: `.${Env.UI_URL!}`,
      httpOnly: true,
      sameSite: "Lax",
      secure: true,
    });
    debug(31);

    if (!bucket) {
      debug(32);
      const user_id = session_id;
      await Promise.all([
        db.user.add({ id: user_id }),
        db.bucket.add({
          user_id,
          email: _email,
          google_drive_authorization: {
            access_token: payload.tokens.access_token!,
            refresh_token,
          },
        }),
        db.app_session.add({
          email: _email,
          session_id,
          user_id,
        }),
      ]);
      debug(33);
    }
    debug(34);

    return c.redirect(Env.UI_URL!);
  });
app
  .openapi({
    path: Env.API_ENDPOINT_AUTH_GOOGLE_SIGNOUT,
    method: "delete",
    responses: {
      204: {
        description: "Logout",
      },
    },
  }, (c) => {
    return c.redirect(
      new URL(Env.UI_URL!).origin,
    );
  });
app
  .openapi({
    method: "get",
    path: "/api/auth/whoami",
    responses: {
      200: {
        description: "Don't remember who you are!",
      },
    },
  }, (c) => {
    throw new HTTPException(500, { message: "Is not implemented yet!" });
  })
  .doc("/api", {
    openapi: "3.0.0",
    info: {
      title: "Goodrive API",
      version: "2.0.0",
    },
  }).get("/", swaggerUI({ url: "/api" }));

if (Env.RUNTIME_ENV !== "prod" || !!"TODO: delete me!".length) {
  app.get("/_drop-db", async (c) => {
    await __drop__all__data__in__kv__();

    return c.json({ ok: true });
  });
}

Deno.serve({
  port: 3000,
}, app.fetch);
