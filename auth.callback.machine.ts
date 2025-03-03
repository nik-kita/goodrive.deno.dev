import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { assign, fromPromise, setup } from "xstate";
import { is_session_normal, Session } from "./const.ts";
import {
  google_process_cb_data,
  ResultGoogleCpDataProcessing,
} from "./google.service.ts";
import { kv, User } from "./kv.ts";
import { clean_auth_cookies } from "./x-actions.ts";
import { eventNames } from "node:process";

const machine = setup({
  types: {
    input: {} as tInput,
    output: {} as tOutput,
    context: {} as tCtx,
  },
  guards: {
    is_some_user_case(_, ctx: tCtx) {
      return !!ctx.user;
    },
  },
  actions: {
    clean_auth_cookies({ context: { c } }) {
      clean_auth_cookies(c);
    },
  },
  actors: {
    process_google_data: fromPromise<
      tActor["process_google_data"]["output"],
      tActor["process_google_data"]["input"]
    >(
      async ({ input: { code, state } }) => {
        const [g, maybeSession] = await Promise.all([
          google_process_cb_data(code),
          kv.get<Session>(["session", state]),
        ]);
        const session = maybeSession.value;

        if (!session) {
          throw new Error("Unable to resolve <state> from google res");
        }

        if (is_session_normal(session)) {
          const maybeUser = await kv.get<User>(["user", session.user_id]);
          const user = maybeUser.value;

          if (!user) {
            throw new Error(
              "Unexpected 'not found' of user by id from session",
            );
          }

          return {
            g,
            user,
          };
        }

        return {
          g,
          unknown_session: session,
        };
      },
    ),
  },
})
  .createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGMCGAbdAjVyDWAdAAoBOA9snLAARRllTpjUSoAuqAxBGQHZgEAlrwBuZPALSYc+YuUqwadBkxbtUCYWLRtBfANoAGALpHjiUAAcysQbr4WQAD0QBaAGwBmAp4CcARk8AFiCADlC-AHYgw3cAGhAAT0RwglD-DMNgwwBWdIAmSN8AX2KEqWxcQlIKKlp6RmZWDm4+AS1xSQxK2RqFJQbVZo0OnT1eM31-cyQQa1t7XkcXBHz3SJ8c-NjQrd9fd3dfBOTV7YIMz38j7c98oODI0vLumWr5OuVGtRawEnISARLOh2AAzMgkAC2BAqbzktUU9RUTXUmlEFHY40mJkc8zs42WbiCOXcBEiGV86TChlCB08Jzc+V8hh8a3JQX82wC+U87meIFhVQIAGUyJCwGwABbCKDUADuYF4bHl5F4UE4ZlxNnxDlmKw8kRZoUMPJyvg5nkM5v8DIQrkuBBy0U80V8kUN1xNpTKIF4ZAgcEcgvwWoWBL1bndpK2tPynMitKCB1trk8xouhkMgWiTMMQSZ-OD7wRA2RP1QoZ1Swjdv8VoIsX8RTyef8oQTKaZ+QI7kz-ge6RJoSZQULryFAFVeHg-XLeNRYFRxtQ0IvK4tCQhPFdHTzfDlgtd3Gt8raggmGyfj1cSVsSWPpELReLqABXRckFeoNezPEbmv2k6Pi5O6xr7paBw5GeF4mse17+Le+T3j6RYimKErSmq8qKsqcqqlA67hqA+qRPkoS7rG8aJsmSSMkcGZZmEbr5kE7g5A+PSEAAwmKwISmAhG6sRbh5AQYS8uscZkUhkRsSm+49oYRRJjkDxhPm3rFEAA */
    id: "callback",
    context({ input }) {
      return {
        ...input,
      };
    },
    initial: "Process google data",
    states: {
      "Process google data": {
        invoke: {
          src: "process_google_data",
          input: ({ context: { gCode, state } }) => ({
            code: gCode,
            state,
          }),
          onDone: [
            {
              target: "Some user case",
              guard: {
                type: "is_some_user_case",
                params({ context }) {
                  return context;
                },
              },
              actions: assign(({ event }) => {
                const user = event.output.user;
                return {
                  g: event.output.g,
                  user,
                };
              }),
            },
            {
              target: "Unknown session case",
              actions: assign(({ event }) => {
                const unknown_session = event.output.unknown_session!;
                return {
                  g: event.output.g,
                };
              }),
            },
          ],
          onError: {
            target: "Something went wrong",
            actions: "clean_auth_cookies",
          },
        },
      },
      "Unknown session case": {},
      "Some user case": {},
      "Something went wrong": {
        always: {
          target: "Complete",
          actions: assign({
            output: {
              exception: new HTTPException(500, {
                message: "Something went wrong (x-callback)",
                cause: "not covered scenario",
              }),
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
};

type tActor = {
  process_google_data: {
    input: {
      code: string;
      state: string;
    };
    output:
      & { g: ResultGoogleCpDataProcessing }
      & ({
        user: User;
        unknown_session?: never;
      } | { user?: never; unknown_session: Session<"unknwon"> });
  };
};

export const auth_callback_machine = machine;
