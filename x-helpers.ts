// deno-lint-ignore-file no-explicit-any
import { fromPromise } from "xstate";

export const fn_to_promise_logic = <
    O extends Partial<{
        multiple_args: boolean;
    }>,
    T extends (
        ...arg: O["multiple_args"] extends true ? any[] : [any]
    ) => any | Promise<any>,
>(
    fn: T,
    options: O = {} as O,
) => {
    const { multiple_args = false } = options;
    return fromPromise<
        Awaited<ReturnType<T>>,
        O["multiple_args"] extends true ? Parameters<T> : Parameters<T>[0]
    >(async ({ input }) => {
        const result = await fn(
            ...(multiple_args ? input : [input]),
        );

        return result;
    });
};
