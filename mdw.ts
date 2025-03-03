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
