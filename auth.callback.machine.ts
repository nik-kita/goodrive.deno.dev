import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { assign, fromPromise, setup } from "xstate";
import {
  google_process_cb_data,
  ResultGoogleCpDataProcessing,
} from "./google.service.ts";
import { clean_auth_cookies } from "./x-actions.ts";

export const auth_callback_machine = setup({
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
    process_google_code: fromPromise<ResultGoogleCpDataProcessing, string>(
      async ({ input }) => {
        const gData = await google_process_cb_data(input);

        return gData;
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
    initial: "Process google code",
    states: {
      "Process google code": {
        invoke: {
          src: "process_google_code",
          input: ({ context: { gCode } }) => gCode,
          onError: {
            target: "Something went wrong",
            actions: "clean_auth_cookies",
          },
          onDone: {
            actions: assign(({ event }) => {
              return {
                g: event.output,
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
};
type tOutput = {
  exception: HTTPException;
};

type tCtx = tInput & {
  output?: tOutput;
  g?: ResultGoogleCpDataProcessing;
};
