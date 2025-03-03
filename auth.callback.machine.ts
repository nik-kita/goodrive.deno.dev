import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { assign, fromPromise, setup } from "xstate";
import { GOOGLE_GDRIVE_SCOPES, Session } from "./const.ts";
import {
    google_process_cb_data,
    google_sign_in_url,
    ResultGoogleCpDataProcessing,
} from "./google.service.ts";
import { kv, User } from "./kv.ts";
import { clean_auth_cookies } from "./x-actions.ts";

const machine = setup({
    types: {
        input: {} as tInput,
        output: {} as tOutput,
        context: {} as tCtx,
    },
    guards: {
        is_new_refresh_token_present({ context }) {
            return !!context.g?.payload.tokens.refresh_token;
        },
        is_session_active(
            {
                context,
            },
        ) {
            return context
                .session!
                ._tag ===
                "Session::normal";
        },
    },
    actions: {
        clean_auth_cookies({ context: { c } }) {
            clean_auth_cookies(c);
        },
    },
    actors: {
        parse_google_code_and_state: fromPromise<
            tActor["parse_google_code_and_state"]["output"],
            tActor["parse_google_code_and_state"]["input"]
        >(
            async ({ input: { code, state } }) => {
                const [g, maybeSession] = await Promise.all([
                    google_process_cb_data(code),
                    kv.get<Session>(["session", state]),
                ]);
                const session = maybeSession.value;

                if (!session) {
                    throw new Error(
                        "Unable to resolve <state> from google res",
                    );
                }

                return {
                    g,
                    session,
                };
            },
        ),
        prepare_redirect_to_google_sign_in_with_gDrive_scopes_incremental:
            fromPromise<
                tActor[
                    "prepare_redirect_to_google_sign_in_with_gDrive_scopes_incremental"
                ]["output"],
                tActor[
                    "prepare_redirect_to_google_sign_in_with_gDrive_scopes_incremental"
                ]["input"]
            >(async ({ input: { session_id, g } }) => {
                const redirect_for_gDrive = google_sign_in_url(
                    {
                        scope: GOOGLE_GDRIVE_SCOPES,
                        state: session_id,
                        include_granted_scopes: true,
                        login_hint: g.info.email!,
                    },
                );

                return {
                    redirect_for_gDrive,
                    authorization_header: `Bearer ${g.payload.tokens
                        .access_token!}`,
                };
            }),
        update_user_with_new_refresh: fromPromise<
            tActor["update_user_with_new_refresh"]["output"],
            tActor["update_user_with_new_refresh"]["input"]
        >(async ({ input: { g } }) => {
        }),
        create_user_and_update_session: fromPromise<
            tActor["create_user_and_update_session"]["output"],
            tActor["create_user_and_update_session"]["input"]
        >(async ({ input: { g, session_id } }) => {
        }),
    },
})
    .createMachine({
        /** @xstate-layout N4IgpgJg5mDOIC5QGMCGAbdAjVyDWAdAAqoBOsYABFAPY1TpXI0RWoB2ElsALqj2ADEEGuzAEAluwBuNPOLSYc+YmQrU6DJizadufAQimy0PCaIDaABgC61m4lAAHGrAlnRjkAA9EATgBmABYAGhAAT0QAWgB2PwBfeLDFbFxCEnIqWnpGSmZWSg4uXn4hMFJSGlICJ3R+ADMqgFsCFOV0tSzNXPzdYoMwIxkaU3N2e3svFzcPdi9fBABGIIAmALDIhBjFghiY4ICYgFZE5IxUlSJK5Dg3dihuW7HCvWytSgh+VAIAYQALMD4SgSWCUMQAd0opDA9WhsD+Ly4UAAIqQJNIqLBmE44JQnHCwOweMD2BoclQnKhwugaKgIIJJkgQNN3GN5tEggAODaIYIANlOIDaaWI1ye90esDcokRZPenz4vwBQJBYLAkOhsLgCKK1FR6Mx2Nx+LghOJUjluUp1Np9IsiwcTJZs3ZCBWRz8PIQQT5nMFwsuYqlUgeFGDMt1b1yCu+ABUAWqNTC4X8Qnq0RjuEbQWQKQSiSTLRSqTS6UrAXhgaCw9LSRhoXTwoVkGYMQzbFNXKzPEyFlE+XyggQrDErAFFu6vQEAv7zu1RSNxaGnhHXt0qDGCPHylRVQA5ADyUOT2sLUeLNrL-wrVcltcK6AbECbuFbQkZzi7Lt7iE5RxWXrHEEs5KCKVyLsGEo1s8kbrh8XxbgC0K3oex5avCZ5wdapYQOWKrViudaPmAjbNm+DIOp2Mxsj+CCcocBB+Csfi+scXp+FYnK7CcSRCnOIoAEqQBI0IttwNBNGAohUDwNBFpQ4LuAiKIZoaNA4qCAAUUjINCklEhgACUwjSZIwzyK0-EqEJEAiYCxKwBJUliJQsnyYpPDKfqmZYupuLaewulgPpfDoIZQwmPwYwTB2TpfjRoALH4QSehEiATkcfq8QGhA2XZYmOZJ0muXJ54KUp6YGlmflaTpelmkZgjlJU1S1A0zSWaB1nCaJDlOcVbllR5XmqdVGmUAFQUhUZEUjFFli2B+zLxT2iXpe6oRpUsAR+IsiS8ewOjwEyOVUd2cy0VEf6pZsUQBHyATDlYz0jnyzE7UERwztlVkdJk8m9LKJQCGd35rXRay7JyHFvUcXpRCsfIxAQPFnF16RBncy7hnWa7kvBfCgwlPjRJyiyLPDKzHCjL2ve9yVfSBFwYxBWN3jBePygh174YmaEprKKlVb540mhQBYWmV2G2kTq0k0sRx8l6iycUz87gTckHY-esH45u2585qKZpkLPnZoUyFi2amH49LdKyxd4OxA98OLJyWVo8zC6a2z0GrkicH6wmEL89qJveWp425ni+bmqSUslraeGVqqftEU+L4tgaDuurEixw1tUQq1YKNq2BmMhuz-vyUHVAh0bYeVWbNUW3mpoS-HWGJ2WACqTgKlQACuFCkOVnmGye8I55do5cUcRw+pybFbSsbtl4GrOV2nguBwhBv15PqZN5HuLR1bHfyXbuE-A2Ah88P5SyoP-elFXjvLdRct9nybtekEVh8lLj9dG3slxvx3nrPeSFdyglQg3DCksu6XggNPcGwQVjDkXsvTYfIWJAM9urCuUFCIQK5oqbcyF9xHngQiRBttu7X2VCnAiOMHwZzItnOKn934LB2iXKwWCC6bBiJyYCwCvZ5V6uJIqLlBpwWGsfMa-k6rBQamFVB8sohMUYjEPkC9AhUzdgA5WKxV4EHdOvQgPwJK1DACDLh51XQqw4oxViQj-D3XMTxRIQA */
        id: "callback",
        context({ input }) {
            return {
                ...input,
                refresh_token: "unknown",
            };
        },
        initial: "Parse google code and state",
        states: {
            "Parse google code and state": {
                invoke: {
                    src: "parse_google_code_and_state",
                    input: (
                        { context: { gCode, state } },
                    ) => ({
                        code: gCode,
                        state,
                    }),
                    onDone: {
                        target: "Processing session and google data",
                        actions: assign(({ event }) => {
                            return {
                                g: event.output
                                    .g,
                                session: event
                                    .output.session,
                            };
                        }),
                    },
                    onError: {
                        target: "#callback.Complete",
                        actions: [
                            "clean_auth_cookies",
                            assign(({ event }) => ({
                                output: {
                                    exception: new HTTPException(
                                        500,
                                        {
                                            message:
                                                "Problem with parsing google data",
                                            cause: event
                                                .error,
                                        },
                                    ),
                                },
                            })),
                        ],
                    },
                },
            },
            "Processing session and google data": {
                initial:
                    "Check is new refresh and gDrive scopes present in google payload",
                states: {
                    "Check is new refresh and gDrive scopes present in google payload":
                        {
                            always: [
                                {
                                    target:
                                        "The new refresh, gDrive scopes are present in google payload",
                                    guard: "is_new_refresh_token_present",
                                },
                                {
                                    target:
                                        "There is NO refresh in google payload",
                                },
                            ],
                        },
                    "The new refresh, gDrive scopes are present in google payload":
                        {
                            initial: "Check is session already active",
                            states: {
                                "Check is session already active": {
                                    always: [
                                        {
                                            guard: "is_session_active",
                                            target:
                                                "Update user with new refresh",
                                        },
                                        "Create new user and update session",
                                    ],
                                },
                                "Update user with new refresh": {
                                    invoke: {
                                        src: "update_user_with_new_refresh",
                                        input({ context: { g } }) {
                                            return {
                                                g: g!,
                                            };
                                        },
                                        onDone: {
                                            target: "#callback.Complete",
                                            actions: assign(
                                                (
                                                    { context: { c, session } },
                                                ) => {
                                                    return {
                                                        output: {
                                                            success_complete_payload:
                                                                {
                                                                    c,
                                                                    session_id:
                                                                        session!
                                                                            .id,
                                                                    email:
                                                                        session!
                                                                            .email!,
                                                                    user_id:
                                                                        session!
                                                                            .user_id!,
                                                                },
                                                        },
                                                    };
                                                },
                                            ),
                                        },
                                        onError: "#callback.Complete",
                                    },
                                },
                                "Create new user and update session": {
                                    invoke: {
                                        src: "create_user_and_update_session",
                                        input({ context: { g, session } }) {
                                            return {
                                                g: g!,
                                                session_id: session!.id,
                                            };
                                        },
                                        onDone: {
                                            target: "#callback.Complete",
                                            actions: assign(
                                                (
                                                    { context: { c, session } },
                                                ) => {
                                                    return {
                                                        output: {
                                                            success_complete_payload:
                                                                {
                                                                    c,
                                                                    session_id:
                                                                        session!
                                                                            .id,
                                                                    email:
                                                                        session!
                                                                            .email!,
                                                                    user_id:
                                                                        session!
                                                                            .user_id!,
                                                                },
                                                        },
                                                    };
                                                },
                                            ),
                                        },
                                        onError: "#callback.Complete",
                                    },
                                },
                            },
                        },
                    "There is NO refresh in google payload": {
                        initial: "Check is session already active",
                        states: {
                            "Check is session already active": {
                                always: [
                                    {
                                        target: "#callback.Complete",
                                        guard: "is_session_active",
                                        actions: assign(
                                            {
                                                output: {
                                                    exception:
                                                        new HTTPException(
                                                            400,
                                                            {
                                                                message:
                                                                    "User is already has active session",
                                                            },
                                                        ),
                                                },
                                            },
                                        ),
                                    },
                                    "#callback.Redirect someone to google with gDrive scopes (incremental)",
                                ],
                            },
                        },
                    },
                },
            },
            "Redirect someone to google with gDrive scopes (incremental)": {
                invoke: {
                    src: "prepare_redirect_to_google_sign_in_with_gDrive_scopes_incremental",
                    input({ context: { g, session } }) {
                        return {
                            g: g!,
                            session_id: session!.id,
                        };
                    },
                    onDone: {
                        target: "Complete",
                        actions: assign(({ event, context: { c } }) => {
                            return {
                                output: {
                                    redirect: c.newResponse(null, {
                                        headers: {
                                            Location: event.output
                                                .redirect_for_gDrive,
                                            Authorization: event.output
                                                .authorization_header,
                                        },
                                    }),
                                },
                            };
                        }),
                    },
                    onError: {
                        target: "Complete",
                    },
                },
            },
            "Complete": {
                type: "final",
            },
        },
        output: ({ context }) => {
            const result = context.output || {
                exception: new HTTPException(500, {
                    message: "Something went wrong (x-callback)",
                    cause: "oops",
                }),
            };

            return result;
        },
    });

type tInput = {
    c: Context;
    gCode: string;
    state: string;
};
type tOutput = {
    exception: HTTPException;
} | {
    redirect: ReturnType<Context["redirect" | "newResponse"]>;
} | {
    success_complete_payload: {
        c: Context;
        session_id: string;
        user_id: string;
        email: string;
    };
};

type tCtx = tInput & {
    output?: tOutput;
    g?: ResultGoogleCpDataProcessing;
    user?: User | undefined;
    session?: Session | undefined;
    refresh_token: "present" | "not-present" | "unknown";
};

type tActor = {
    parse_google_code_and_state: {
        input: {
            code: string;
            state: string;
        };
        output: { g: ResultGoogleCpDataProcessing; session: Session };
    };
    prepare_redirect_to_google_sign_in_with_gDrive_scopes_incremental: {
        input: {
            session_id: string;
            g: ResultGoogleCpDataProcessing;
        };
        output: {
            redirect_for_gDrive: string;
            authorization_header: string;
        };
    };
    update_user_with_new_refresh: {
        input: {
            g: ResultGoogleCpDataProcessing;
        };
        output: void;
    };
    create_user_and_update_session: {
        input: {
            g: ResultGoogleCpDataProcessing;
            session_id: string;
        };
        output: void;
    };
};

export const auth_callback_machine = machine;
