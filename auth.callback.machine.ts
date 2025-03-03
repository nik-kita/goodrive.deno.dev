import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { assign, fromPromise, setup } from "xstate";
import {
  google_process_cb_data,
  ResultGoogleCpDataProcessing,
} from "./google.service.ts";

export const auth_callback_machine = setup({
  types: {
    input: {} as tInput,
    output: {} as tOutput,
    context: {} as tCtx,
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
    /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgGMBDAGxICMiCBrfEABy1gEsAXZrDOgD0QEYATOgCe-AcgnIgA */
    id: "callback",
    context({ input }) {
      return {
        ...input,
      };
    },
    initial: "Process google code",
    states: {
      "Process google code": {},
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
