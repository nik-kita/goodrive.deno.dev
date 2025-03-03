// deno-lint-ignore-file no-unused-vars
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono, z } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { createActor, OutputFrom } from "xstate";
import { auth_callback_machine } from "./auth.callback.machine.ts";
import { auth_sign_in_machine } from "./auth.sign-in.machine.ts";
import { Session, User } from "./const.ts";
import { Env } from "./env.ts";
import { __drop__all__data__in__kv__, kv } from "./kv.ts";
import { mdw_cors } from "./mdw.ts";

const app = new OpenAPIHono();

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
    }, async (c) => {
        const sign_in_actor = createActor(auth_sign_in_machine, {
            input: {
                c,
            },
        });
        const output = await new Promise<OutputFrom<typeof sign_in_actor>>(
            (resolve, reject) => {
                sign_in_actor.subscribe((s) => {
                    if (s.status === "active") {
                        ///
                    } else if (s.status === "done") {
                        resolve(s.output);
                    } else {
                        reject(s.toJSON());
                    }
                });
                sign_in_actor.start();
            },
        );

        if (output.exception) {
            throw output.exception;
        }

        return output.redirect || output.response;
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
        throw new HTTPException(500, { message: "Is not implemented yet" });
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
        const callback_actor = createActor(auth_callback_machine, {
            input: {
                c,
                gCode: code,
                state,
            },
        });
        const output = await new Promise<OutputFrom<typeof callback_actor>>(
            (resolve, reject) => {
                callback_actor.subscribe((s) => {
                    if (s.status === "active") {
                        ///
                    } else if (s.status === "done") {
                        resolve(s.output);
                    } else {
                        reject(s.toJSON());
                    }
                });
                callback_actor.start();
            },
        );

        if (output.exception) {
            throw output.exception;
        } else if (output.success_complete_payload) {
            return output.success_complete_payload.c.redirect(Env.UI_URL!);
        }

        return output.redirect;
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
    }, async (c) => {
        const session_id = getCookie(c, "session");
        console.log(getCookie(c));
        console.log('session', getCookie(c, 'session'));
        console.log('session secure', getCookie(c, 'session', 'secure'));
        console.log('__Secure-session', getCookie(c, '__Secure-session'));
        console.log('__Secure-session secure', getCookie(c, '__Secure-session', 'secure'));

        if (!session_id) {
            throw new HTTPException(403, {
                message: "Who you are?",
                cause: "no session",
            });
        }

        const session = await kv.get<Session>(["session", session_id]);

        if (!session.value) {
            throw new HTTPException(403, {
                message: "Who you are??",
                cause: "no found session",
            });
        }

        if (session.value._tag === "Session::unknown") {
            return c.json({
                message: "You Are Someone",
                description:
                    "Though your session is valid and active you are not authorize any google-drive",
            });
        }

        const user = await kv.get<User>(["user", session.value.user_id]);

        if (!user.value) {
            throw new HTTPException(500, {
                message: "Sorry. We forgot who you are, mr." +
                    session.value.email,
                cause:
                    "the session is exists and valid, but user by <user_id> from it was no found",
            });
        }

        return c.json({
            message: "Bingo!",
            iam: {
                ...user.value,
                buckets: Array.from(user.value.buckets.values()).map((
                    { email },
                ) => email),
                session_email: session.value.email,
            },
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
    port: Env.API_PORT,
}, app.fetch);
