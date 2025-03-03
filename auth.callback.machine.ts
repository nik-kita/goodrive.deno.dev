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

const machine = setup({
  types: {
    input: {} as tInput,
    output: {} as tOutput,
    context: {} as tCtx,
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
    /** @xstate-layout N4IgpgJg5mDOIC5QGMCGAbdAjVyDWAdAMoD2AtmAC4AWAlgHZQAEA7mPZawE4mMDEAbQAMAXUSgADiVi1KtXuJAAPREIA0IAJ6qAvno30SEOIrSYc+RVJlyFSZYgC0AFgAcG7QkeuA7AQCs+iBm2LiEAAo8yHCwTFAkJFDoYEzIRmBW0rLy9IoqCACMAGzuWogATEJCQSEWhKQUNAzMbBzcvFCZNjl5iMU+HhUFBOXlRf5F5YE6GrVhBADC5BLJlBn21tl2oPnqZQj+lQQAnKfHAMyux0Vuzpd6ekA */
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
          onError: {
            target: "Something went wrong",
            actions: "clean_auth_cookies",
          },
          onDone: {
            actions: assign(({ event }) => {
              return {
                g: event.output.g,
              };
            }),
          },
        },
      },
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
  user?: User;
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
