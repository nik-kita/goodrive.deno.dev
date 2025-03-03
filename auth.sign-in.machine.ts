import { SECOND } from "@std/datetime/constants";
import { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { assign, fromPromise, setup } from "xstate";
import {
    GOOGLE_EMAIL_SCOPE,
    GOOGLE_OPEN_ID_SCOPE,
    Session,
    User,
} from "./const.ts";
import { Env } from "./env.ts";
import { google_sign_in_url } from "./google.service.ts";
import { kv } from "./kv.ts";
import { clean_auth_cookies } from "./x-actions.ts";

export const auth_sign_in_machine = setup({
    types: {
        input: {} as tInput,
        output: {} as tOutput,
        context: {} as tCtx,
    },
    guards: {
        is_prev_session_exists({ context: { auth_cookies } }) {
            return !!auth_cookies;
        },
    },
    actions: {
        clean_auth_cookies({ context: { c } }) {
            clean_auth_cookies(c);
        },
    },
    actors: {
        get_user_from_prev_session: fromPromise<User, string>(
            async ({ input }) => {
                const user = await kv.get<string>([
                    "user",
                    "by-session",
                    input,
                ]).then(
                    (maybe_user_id) => {
                        if (maybe_user_id.value) {
                            return kv.get<User>([
                                "user",
                                maybe_user_id
                                    .value,
                            ]);
                        }

                        return null;
                    },
                );

                if (!user) {
                    throw new Error(
                        "Prev session is not valid",
                    );
                }

                return user.value!;
            },
        ),
        prepare_redirect_to_google_sign_in_with_email_scopes: fromPromise<
            string,
            Context
        >(
            async ({ input }) => {
                const session_id = crypto.randomUUID();
                await Promise.all([
                    kv.set(
                        ["session", session_id],
                        {
                            id: session_id,
                            __typename: "Session",
                            _tag: "Session::unknown",
                        } satisfies Session,
                    ),
                    kv.set(
                        [
                            "session",
                            "where-unknown",
                            session_id,
                        ],
                        session_id,
                        { expireIn: SECOND * 60 * 5 },
                    ),
                ]);
                const redirect_url = google_sign_in_url({
                    scope: [
                        GOOGLE_EMAIL_SCOPE,
                        GOOGLE_OPEN_ID_SCOPE,
                    ],
                    state: session_id,
                });
                console.log(Env);
                setCookie(input, "session", session_id, {
                    domain: `.${Env.UI_URL}`,
                    httpOnly: true,
                    sameSite: "Lax",
                    secure: true,
                });

                return redirect_url;
            },
        ),
    },
    delays: {
        max_total_time: 3000,
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5SwJZQHYFoXoMQA9YAXAQyLADoSAzcgJwAoBbE-AfSIHtSAbDlJmACUuVBmzoA2gAYAuolAAHTqiIpO6BSHyIALACYANCACeiABwBGCgFZp96ZYCcANhf7L+804C+P42JYOBQAwgAWYADGANYABIp0YABusbBwqBqhETGxKLCxJACuRGGxkZyc0ShwsWD4eUSwAPy4MvJIIMqq6podOggAzLrSFNIDni5OAOzSBjMDxmaD5iPzllMrlkPDs34BaEHoWVFxCcmp6T3HOXkFxaXlldX5dQ3NrZbtSiooahpa-ScW1GG0sdgG5hc5iGNkWiH0AxcFCcNnGTmk030uhRnj2IECEmup0SKTSsAyR3CJ1y+TOpMuGliSRIPBQEBaEA0lBwSUqlAJwSpOTpF3JVyFcVuIrJFKZLLZTQQPM4kTIPTabS0XV+PQBiCBAxBVnBkOhulhpj0AxsyP0010pvW0hcUymeIFlOyxPOMvFXpp8RJotlzNZ7NwYDodE4dAoih4ZGoMaYFA9RMDPoZnupUqDvsZoYVSvQvNVfykck1HW15b1CANRrBY1NMLhgwMyKmbn09nMBksuhcA3dB0JACVIChEpEiKlOIIubEuLEoBUoDwwLEAO6-UpMHACFmpcqKOC4Tnobklvmp0fBCcQKdRWewedgRfL1ecdebnclWL7ugh48MenCnrAxalmqGganIWo-LWfSIO4baQk4FDDEOPY2FM+hDn2I7iPek7Ti+b4fpwK5rhu267gBB4sCBsAnmekbRrG8aJsmt5EUcD5PjOc4LpeS6UV+P60f+gHAaB4GQSq0EVrIVbfN0-xIQglguNI+gUPodiWFpUxghCXhtgiUyjIiNiWI4eHePohGHBQADKWYBiyiQkBAJgFDOKDMuQECGHOsToNwYQ4FAomxJyrRwdWCG6hpNhGJa9buBQ1pOLo2JOlsYxOYSLlviUUXbmA6Czlu0boFA8VfJ0SXqaA-R2uhsxQk4Th4YOkK6G2uGWQY0w2O4UwQj1w54uFEBwFoHrwWpvStYgmBYm2mAuEVgr+tKWZLTqLXaPCA3pXhlkouMXaWNCLi3Tt2bCnmWbprcRT-o8VQ1K8xDNIdiGrQguFtgMuG2NZ+hTLlLjYl2uiPem+1ipkEoBsjIbyuyAPJUDOG6LYYIuoO6xmpYoM2Da5rXaCY1OOMNiI-xpFCe+ImftRv50dJjGyfNiXLXWhn03pVgDHh2kujY0LmXhFAbC4djmlYUzSyiiNuSj6AeTwXk+X5aiBZAIWvmFEXlcunI48d-TCwT7gGZT+h2kMCzpboQy2va4wDGD6LTfsvGuaVkV1RVVXbrVUDWytJ3A1Mg3YhQRPjDs+nmNDiMhPO8ZgOQMd1rotkULDzouhs5pDuT6XmN4FC114ugzG41O+H4PhAA */
    id: "sign-in",
    context({ input }) {
        return {
            ...input,
            auth_cookies: getCookie(input.c, "auth"),
            output: null,
        };
    },
    after: {
        max_total_time: {
            target: ".Complete",
            actions: ["clean_auth_cookies"],
        },
    },
    initial: "Check prev session",
    states: {
        "Check prev session": {
            initial: "Check is auth cookies exists",
            states: {
                "Check is auth cookies exists": {
                    always: [
                        {
                            guard: "is_prev_session_exists",
                            target: "Check is prev session valid?",
                        },
                        "#sign-in.Redirect someone to google with minimal scopes",
                    ],
                },
                "Check is prev session valid?": {
                    invoke: {
                        src: "get_user_from_prev_session",
                        input: (
                            {
                                context: {
                                    auth_cookies,
                                },
                            },
                        ) => auth_cookies!,
                        onError: {
                            actions: [
                                "clean_auth_cookies",
                            ],
                            target:
                                "#sign-in.Redirect someone to google with minimal scopes",
                        },
                        onDone:
                            "#sign-in.Session is already activated, so nothing to do",
                    },
                },
            },
        },
        "Redirect someone to google with minimal scopes": {
            invoke: {
                src: "prepare_redirect_to_google_sign_in_with_email_scopes",
                input: ({ context: { c } }) => c,
                onDone: {
                    target: "Complete",
                    actions: assign(
                        ({ context: { c }, event }) => {
                            return {
                                output: {
                                    redirect: c.redirect(
                                        event.output,
                                    ),
                                },
                            };
                        },
                    ),
                },
                onError: {
                    target: "Complete",
                },
            },
        },
        "Session is already activated, so nothing to do": {
            always: {
                target: "Complete",
                actions: assign({
                    output: {
                        exception: new HTTPException(
                            400,
                            {
                                message: "Not required sign-in request",
                                cause: "You are already logged in",
                            },
                        ),
                    },
                }),
            },
        },
        "Complete": {
            type: "final",
        },
    },
    output: ({ context }) => {
        const result = context.output || {
            exception: new HTTPException(500, {
                message: "Something went wrong (x-sign-in)",
                cause: "oops",
            }),
        };

        return result;
    },
});

type tInput = {
    c: Context;
};
type tCtx = tInput & {
    auth_cookies: string | undefined;
    output: tOutput | null;
};
type tOutput = {
    response: Response;
    redirect?: never;
    exception?: never;
} | {
    redirect: ReturnType<Context["redirect"]>;
    response?: never;
    exception?: never;
} | {
    exception: HTTPException;
    response?: never;
    redirect?: never;
};
