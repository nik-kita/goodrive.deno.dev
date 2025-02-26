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

app.use(mdw_cors());

(app as OpenAPIHono<mdw_ui_redirect_catch_all & mdw_authentication>)
  .openapi({
    path: Env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN,
    method: "get",
    middleware: [
      mdw_ui_redirect_catch_all,
      // @ts-ignore
      mdw_authentication,
    ],
    responses: {
      200: {
        description: "Authenticate user. Obtain email.",
      },
    },
  }, async (c) => {
    if (c.var.auth.as === "user") {
      throw new HTTPException(400, {
        message: `User is already authenticated as ${c.var.auth.session.email}`,
      });
    }

    const id = crypto.randomUUID();
    const redirect = google_sign_in_url({
      scope: [GOOGLE_EMAIL_SCOPE, GOOGLE_OPEN_ID_SCOPE],
      state: id,
    });

    await db.ghost.add({
      id,
      email: null,
      access_token: null,
      user_id: null,
    }, {
      expireIn: SECOND * 30,
    });
    await db.ghost.findByPrimaryIndex("id", id);

    return c.redirect(redirect);
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
    const state: {
      auth_cookie: string | undefined;
    } = {
      auth_cookie: getCookie(c, AUTH_COOKIE_NAME),
    };

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
    const { code, error, state } = c.req.valid("query");

    if (error || !code || !state) {
      throw new HTTPException(500, {
        message:
          `Fail to process google cb... <code> ${code}, <state> ${state}`,
        cause: error,
      });
    }

    const [
      {
        info: { email, scopes },
        payload: { tokens: { access_token, refresh_token } },
      },
      ghost,
    ] = await Promise.all([
      google_process_cb_data(code),
      db.ghost.findByPrimaryIndex("id", state).then((r) => {
        if (!r?.value) {
          throw new HTTPException(500, {
            message: "ghost for session-candidate was not found",
          });
        }
        return r.value;
      }),
    ]);
    const is_g_drive_scopes_present =
      intersect(scopes, GOOGLE_GDRIVE_SCOPES).length > 0;

    if (!email && !is_g_drive_scopes_present) {
      deleteCookie(c, AUTH_COOKIE_NAME);

      throw new HTTPException(500, {
        message: "Fail to process google cb",
        cause: "Missing email and g_drive scopes",
      });
    }

    const bucket = email
      ? await db.bucket.findByPrimaryIndex("email", email).then((
        r,
      ) => r?.value || null)
      : null;

    if (!is_g_drive_scopes_present && !bucket) {
      if (email && access_token) {
        await db.ghost.deleteByPrimaryIndex(
          "id",
          state,
          {
            consistency: "eventual",
          },
        );

        const id = crypto.randomUUID();
        await Promise.all([
          db.ghost.add({
            id,
            access_token,
            email: email,
            user_id: ghost.user_id || id,
          }),
          db.ghost.deleteByPrimaryIndex("id", ghost.id),
        ]);

        const redirect_for_g_drive = google_sign_in_url({
          scope: GOOGLE_GDRIVE_SCOPES,
          state: id,
          include_granted_scopes: true,
          login_hint: email!,
        });

        return c.newResponse(null, {
          status: 302,
          headers: {
            Location: redirect_for_g_drive,
            ...(access_token &&
              { "Authorization": `Bearer ${access_token}` }),
          },
        });
      }

      throw new HTTPException(500, {
        message: "Missing email/access_token and gDrive scopes",
      });
    }

    const _refresh_token = refresh_token ||
      bucket?.google_drive_authorization.refresh_token;
    if (!_refresh_token) {
      deleteCookie(c, AUTH_COOKIE_NAME);

      throw new HTTPException(500, { message: "Missing google refresh token" });
    }

    if (!ghost.email && !email) {
      throw new HTTPException(500, {
        message: "Missing email in google cb and ghost",
      });
    }

    const _email = email || ghost.email!;

    if (_email) {
      throw new HTTPException(500, { message: "Missing _email" });
    }

    const session_id = crypto.randomUUID();

    setCookie(c, AUTH_COOKIE_NAME, session_id, {
      domain: `.${Env.UI_URL!}`,
      httpOnly: true,
      sameSite: "Lax",
      secure: true,
    });

    if (!bucket) {
      const user_id = session_id;
      await Promise.all([
        db.user.add({ id: user_id }),
        db.bucket.add({
          user_id,
          email: _email,
          google_drive_authorization: {
            access_token: access_token || ghost.access_token!,
            refresh_token: _refresh_token,
          },
        }),
      ]);
    }

    await db.app_session.add({
      email: _email,
      session_id,
      user_id: ghost.user_id || session_id,
    });

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
