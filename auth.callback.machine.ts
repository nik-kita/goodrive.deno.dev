import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { assign, fromPromise, setup } from "xstate";
import { Session } from "./const.ts";
import {
    google_process_cb_data,
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
    },
})
    .createMachine({
        /** @xstate-layout N4IgpgJg5mDOIC5QGMCGAbdAjVyDWAdAAqoBOsYABFAPY1TpXI0RWoB2ElsALqj2ADEEGuzAEAluwBuNPOLSYc+YmQrU6DJizadufAQimy0PCaIDaABgC61m4lAAHGrAlnRjkAA9EAWgA2AFYAGhAAT0QADiCAX1iwxWxcQhJyKlp6RkpmVkoOLl5+ITBSUhpSAid0fgAzCoBbAiTlVLUMzWzc3UKDMCMZGlNzdnt7Lxc3D3YvXwQARnmoqLDIhABOK3jEjGSVInLkODd2KG5jkfy9TK1KCH5UAgBhAAswfEoJWEoxAHdKUhgWqA2AvShOEFgdg8T7sDRZKhOVDhdA0VAQQTjJAgSbuEazfzzADsRNWiAALESAEwEIlxBIgFopYiHC6nc6wNyiK5cG7Ze58Z5vD5fH5gf6A4FwMEQuBQmFSeG3JEotEYizzBzY3HTAkLADM8zJCEpNLp20Zu1aLKGbLOFE5lwKSv5DwIABU3oDPt8AHIAeQBQJBYMVfMRyNR6KF7zwPo5XLhGEB6PC+WQZmkQixzlceM82Lm6yp62NQXJWwt7B08GxTPwEzzusL-n1huNfipVipFvrbXSLu0eWdRQEjam+JbCCJMVpUU2ASpoQihPm5II9J2SmZB1tjvZDsTPMHdwe4-zMynnai+uNVP1Vg3vatO9Z+-tF25zvDp8Fr1j8Z-EGUqguCkLQrCJ4qlGEDns2oBzH48xUuSxqGlEz7bvsb4nB+jpftcnRUAKjyelQQGSiG8ayhQEFhkR4KRmqcGTgh-j3suaxRFYARPgyfY2kc74Jk6hEIr+pFelQooBsBVH0eJ0HMdqTasT4iD6kSVhoUS67kusBlRJS5LIfMVjrOSmF7KkOFSHhR7fgxJEelJ8ayZR0qQT+SnRv+IrfIeTroCmEBprgmZgCxBZsSaJIEFY5IBFEdLGolPb8S+2F7rhIkEbyTlumR3oyYGHmgQpypMdGUWXjFJkrCuCBBOsRIblY7XzEES7JfO8xWdaTw0A01RgGOKkTtF6kbGZBDrElKWNWZnUEEu8TxEAA */
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
                initial: "Check is new refresh present in google payload",
                states: {
                    "Check is new refresh present in google payload": {
                        always: [
                            {
                                target:
                                    "The new refresh is present in google payload",
                                guard: "is_new_refresh_token_present",
                            },
                            {
                                target: "There is NO refresh in google payload",
                            },
                        ],
                    },
                    "The new refresh is present in google payload": {},
                    "There is NO refresh in google payload": {
                        initial: "Check is session already active",
                        states: {
                            "Check is session already active": {
                                always: [
                                    {
                                        target: "#callback.Complete",
                                        guard(
                                            {
                                                context,
                                            },
                                        ) {
                                            return context
                                                .session!
                                                ._tag ===
                                                "Session::normal";
                                        },
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
                                ],
                            },
                            "": {},
                        },
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
};

export const auth_callback_machine = machine;
