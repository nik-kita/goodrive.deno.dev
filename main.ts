// deno-lint-ignore-file no-unused-vars
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono, z } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { AUTH_COOKIE_NAME } from "./const.ts";
import { Env } from "./env.ts";
import { __drop__all__data__in__kv__ } from "./kv.ts";
import { mdw_cors, mdw_ui_redirect_catch_all } from "./mdw.ts";

const app = new OpenAPIHono();

app.use(mdw_cors());
app
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
        return c.redirect("/");
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
        throw new HTTPException(500, {
            message: "Is not implemented yet!",
        });
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
