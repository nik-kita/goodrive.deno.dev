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

if (Env.RUNTIME_ENV !== "prod" || !!"TODO: delete me!".length) {
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
  }, async (c) => {
    const url = new URL(c.req.url);
    const prev_email_only_session_id = url.searchParams.get(
      "session_id",
    );

    if (prev_email_only_session_id) {
      const success_url = url.searchParams.get("success_url") || Env.API_URL;
      const ghost = await db.ghost.findByPrimaryIndex(
        "success_url_with_session_id",
        `${success_url}`,
      ).then((r) => r?.value || null);

      if (ghost) {
        return GoogleAuth.google_drive_sign_in_incremental(c.req.raw, {
          email: ghost.data.email,
          access_token: ghost.data.access_token,
        });
      }
    }

    return GoogleAuth.google_drive_sign_in(c.req.raw);
  })
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
    const is_g_drive_scopes_present =
      intersect(info.scopes, GOOGLE_GDRIVE_SCOPES).length > 0;
    /// 500: nothing to do
    if (!email && !is_g_drive_scopes_present) {
      deleteCookie(c, OAUTH_COOKIE_NAME);
      const success_url = response.headers.get("Location");

      return c.redirect(
        new URL(success_url!).origin +
          `?error=500&details=${
            encodeURIComponent("both google-drive access and email missing")
          }`,
      );
    }

    const bucket = email
      ? await db.bucket.findByPrimaryIndex("email", email).then((
        r,
      ) => r?.value)
      : null;

    /// 300: new email => redirect obtain google-drive access and refresh tokens
    if (!is_g_drive_scopes_present && !bucket) {
      const success_url = response.headers.get("Location") || Env.API_URL;
      const success_url_with_session_id = `${success_url}${sessionId}`;
      await db.ghost.deleteByPrimaryIndex(
        "success_url_with_session_id",
        success_url_with_session_id,
        {
          consistency: "eventual",
        },
      );
      await db.ghost.add({
        success_url_with_session_id,
        data: {
          success_url,
          access_token: tokens.accessToken,
          email: email!, /// ((!email && !is_gdrive) || !is_gdrive) => email!
        },
      });

      return c.redirect(
        Env.API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE +
          `?success_url=${success_url}${sessionId}&session_id=${sessionId}`,
      );
    }

    const access_token = tokens.accessToken;
    const refresh_token = tokens.refreshToken ||
      bucket?.google_drive_authorization.refresh_token;

    /// 500: we need refresh token in any case
    if (!refresh_token) {
      deleteCookie(c, OAUTH_COOKIE_NAME);
      const success_url = response.headers.get("Location");

      return c.redirect(
        new URL(success_url!).origin +
          `?error=500&details=${
            encodeURIComponent("refresh token is missing")
          }`,
      );
    }

    let is_success_url_clean: boolean | string = true;

    /// the first or fresh authoRization with google-drive access
    if (is_g_drive_scopes_present) {
      const google_drive_authorization = {
        access_token,
        refresh_token,
      };

      const success_url = response.headers.get("Location");
      const emailOrData = email || await (async () => {
        is_success_url_clean = false;
        if (!success_url) {
          return null;
        }

        return await db.ghost.findByPrimaryIndex(
          "success_url_with_session_id",
          success_url,
        ).then((r) => {
          if (r?.value) {
            is_success_url_clean = r.value.data.success_url;

            return r.value.data;
          }

          return null;
        }).then((rr) => {
          if (rr) {
            db.ghost.deleteByPrimaryIndex(
              "success_url_with_session_id",
              success_url,
              { consistency: "eventual" },
            );
          }

          return rr;
        });
      })();

      if (!emailOrData) {
        return c.redirect(
          new URL(success_url!).origin +
            `?error=500&details=${
              encodeURIComponent("unable to authenticate email")
            }`,
        );
      }
      const _email = typeof emailOrData === "string"
        ? emailOrData
        : emailOrData.email;

      /// fresh => update
      if (bucket) {
        await db.bucket.updateByPrimaryIndex("email", _email, {
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
            email: _email,
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

    if (typeof is_success_url_clean === "string") {
      return c.redirect(is_success_url_clean);
    } else if (is_success_url_clean) {
      return response;
    }

    deleteCookie(c, OAUTH_COOKIE_NAME);

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
