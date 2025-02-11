import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { intersect } from "@std/collections";
import { deleteCookie } from "hono/cookie";
import { GOOGLE_GDRIVE_SCOPES, OAUTH_COOKIE_NAME } from "./const.ts";
import { Env } from "./env.ts";
import { GoogleAuth } from "./google-auth.ts";
import { __drop__all__data__in__kv__, db } from "./kv.ts";
import { mdw_cors } from "./mdw.ts";

const app = new OpenAPIHono();

app.use(mdw_cors());

if (Env.RUNTIME_ENV !== "prod") {
  app.get("/_drop-db", async (c) => {
    await __drop__all__data__in__kv__();

    return c.json({ ok: true });
  });
}

app
  .openapi({
    path: Env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN,
    method: "get",
    responses: {
      200: {
        description: "Authenticate user. Obtain email.",
      },
    },
  }, (c) => GoogleAuth.email_sign_in(c.req.raw))
  .openapi({
    path: Env.API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE,
    method: "get",
    responses: {
      200: {
        description:
          "Authorize user. Ask to grant access to user's google-drive.",
      },
    },
  }, (c) => GoogleAuth.google_drive_sign_in(c.req.raw))
  .openapi({
    path: Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    method: "get",
    responses: {
      200: {
        description:
          "This endpoint should not be used directly. The google use it.",
      },
    },
  }, async (c) => {
    const {
      sessionId,
      tokens,
      response,
    } = await GoogleAuth.handle_cb(c.req.raw);
    const info = await GoogleAuth.oauth2_client.getTokenInfo(
      tokens.accessToken,
    );
    const email = info.email;

    /// 500: we need email in any case
    if (!email) {
      deleteCookie(c, OAUTH_COOKIE_NAME);
      return response;
    }

    const is_g_drive_scopes_present =
      intersect(info.scopes, GOOGLE_GDRIVE_SCOPES).length > 0;
    const bucket = await db.bucket.findByPrimaryIndex("email", email).then((
      r,
    ) => r?.value);

    /// 300: new email => redirect obtain google-drive access and refresh tokens
    if (!is_g_drive_scopes_present && !bucket) {
      const success_url = response.headers.get("Location");
      return c.redirect(
        Env.API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE +
        `?success_url=${success_url}`,
      );
    }

    const access_token = tokens.accessToken;
    const refresh_token = tokens.refreshToken ||
      bucket?.google_drive_authorization.refresh_token;

    /// 500: we need refresh token in any case
    if (!refresh_token) {
      deleteCookie(c, OAUTH_COOKIE_NAME);
      return response;
    }

    /// the first or fresh authoRization with google-drive access
    if (is_g_drive_scopes_present) {
      const google_drive_authorization = {
        access_token,
        refresh_token,
      };

      /// fresh => update
      if (bucket) {
        await db.bucket.updateByPrimaryIndex("email", email, {
          google_drive_authorization,
        });
      } /// first => create
      else {
        const user_id = crypto.randomUUID();

        await Promise.all([
          db.user.add({
            id: user_id,
          }),
          db.bucket.add({
            email,
            user_id,
            google_drive_authorization,
          }),
          db.app_session.add({
            user_id,
            session_id: sessionId,
          }),
        ]);
      }
    } else {
      /// authenticated user has authorized bucket
      /// (no code required)
    }

    /// happy
    return response;
  })
  .openapi({
    path: Env.API_ENDPOINT_AUTH_GOOGLE_SIGNOUT,
    method: "delete",
    responses: {
      204: {
        description: "Logout",
      },
    },
  }, (c) => GoogleAuth.sign_out(c.req.raw))
  .doc("/api", {
    openapi: "3.0.0",
    info: {
      title: "Goodrive API",
      version: "1.0.0",
    },
  }).get("/", swaggerUI({ url: "/api" }));

Deno.serve({
  port: 3000,
}, app.fetch);
