import { Context } from "hono";
import { setup } from "xstate";

export const auth_callback_machine = setup({
  types: {
    input: {} as tInput,
    output: {} as tOutput,
    context: {} as tCtx,
  },
})
  .createMachine({
    id: "callback",
    context({ input }) {
      const {
        c,
      } = input;
      return {
        output: null,
        c,
      };
    },
  });

type tInput = {
  c: Context;
  gCode: string;
};
type tOutput = never;

type tCtx = Pick<tInput, "c"> & {
  output: tOutput | null;
};
