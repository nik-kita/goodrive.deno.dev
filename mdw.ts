import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { AppCtx } from "./const.ts";

export const mdw_cors = () => {
    return cors({
        origin: '*',
        credentials: true,
    });
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
