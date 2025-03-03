import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { AppCtx } from "./const.ts";
import { Env } from "./env.ts";

export const mdw_cors = () => {
    if (Env.RUNTIME_ENV === "prod" || Env.RUNTIME_ENV === "stage") {
        return cors({ origin: Env.UI_URL! });
    }

    return cors();
};

export const mdw_attach_referer = createMiddleware<
    AppCtx<{
        referer?: string;
    }>
>(async (c, next) => {
    c.set("referer", c.req.header("referer"));
    await next();

    return;
});

export type mdw_ui_redirect_catch_all = AppCtx;
export const mdw_ui_redirect_catch_all = createMiddleware<
    mdw_ui_redirect_catch_all
>(
    async (c, next) => {
        try {
            await next();

            return;
        } catch (err: unknown) {
            console.error(err);
            const _err = err as Record<string, unknown> ||
                undefined;
            const error_name = _err?.name || "something-wrong";
            const message = _err?.message || "oops";
            const details = _err?.details || "unknown";
            const cause = _err?.cause || "unknown";

            c.res = c.newResponse(
                new URL(Env.UI_URL!).origin +
                    `/500?name=${error_name}&message=${message}&cause=${cause}&details=${details}`,
            );
        }
    },
);
