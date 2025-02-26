// deno-lint-ignore-file no-unused-vars
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { SECOND } from "@std/datetime";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import {
  AUTH_COOKIE_NAME,
  GOOGLE_EMAIL_SCOPE,
  GOOGLE_OPEN_ID_SCOPE,
} from "./const.ts";
import { Env } from "./env.ts";
import { google_sign_in_url } from "./google.service.ts";
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
      /// @ts-ignore
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
    await db.ghost.add({ id }, { expireIn: SECOND * 30 });

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
app
  .openapi({
    path: Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    method: "get",
    middleware: [mdw_ui_redirect_catch_all],
    responses: {
      200: {
        description:
          "This endpoint should not be used directly. The google use it.",
      },
    },
  }, (c) => {
    return c.redirect(
      new URL(Env.UI_URL!).origin +
        `?error=500&details=${
          encodeURIComponent("both google-drive access and email missing")
        }`,
    );
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

/**
 *
      setCookie(c, AUTH_COOKIE_NAME, Date.now().toString(), {
      domain: `.${Env.UI_URL!}`,
      httpOnly: true,
      sameSite: "Lax",
      secure: true,
    });

 */
