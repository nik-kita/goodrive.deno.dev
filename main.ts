// deno-lint-ignore-file no-unused-vars
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Cookie } from "@std/http";
import { OAuth2Client } from "google-auth-library";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { Env } from "./env.ts";
import { __drop__all__data__in__kv__ } from "./kv.ts";
import { mdw_cors } from "./mdw.ts";

const oauth2_client = new OAuth2Client();
const app = new OpenAPIHono();
const cookieOptions: Partial<Cookie> = {
  domain: Env.UI_URL!,
  httpOnly: true,
  sameSite: "Lax",
  secure: true,
};
const redirectUri = Env.API_URL +
  Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE;

app.use(mdw_cors());
app
  .openapi({
    path: Env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN,
    method: "get",
    responses: {
      200: {
        description: "Authenticate user. Obtain email.",
      },
    },
  }, (c) => {
    const already = getCookie(c);
    setCookie(c, "auth", Date.now().toString(), {
      domain: '.stage.goodrive.services',
      httpOnly: true,
      sameSite: "Lax",
      secure: true,
    });
    return c.redirect(
      `${Env.API_URL}${Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE}?already=${Object.entries(already).join('-')}`,
    );
  })
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
    return c.redirect(
      `${Env.API_URL}/${Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE}`,
    );
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
  }, (c) => {
    return c.redirect(
      new URL(Env.UI_URL!).origin +
      `?error=500&details=${encodeURIComponent("both google-drive access and email missing")
      }`,
    );
  })
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
  })
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
