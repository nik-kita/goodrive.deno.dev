import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { Env } from "./env.ts";

export const mdw_cors = () => {
  if (Env.RUNTIME_ENV === "prod" || Env.RUNTIME_ENV === "stage") {
    return cors({ origin: Env.UI_URL! });
  }

  return cors();
};

export const mdw_attach_referer = createMiddleware<{
  Variables: {
    referer?: string;
  };
}>((c, next) => {
  c.set("referer", c.req.header("referer"));
  return next();
});

export const mdw_ui_redirect_catch_all = createMiddleware(async (c, next) => {
  try {
    return await next();
  } catch (err: unknown) {
    console.error(err);
    const _err = err as Record<string, unknown> || undefined;
    const error_name = _err?.name || "something-wrong";
    const message = _err?.message || "oops";
    const details = _err?.details || "unknown";

    return c.redirect(
      new URL(Env.UI_URL!).origin +
        `/500?name=${error_name}&message=${message}&details=${details}`,
    );
  }
});
