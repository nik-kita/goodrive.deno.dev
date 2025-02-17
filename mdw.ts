import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { Env } from "./env.ts";

export const mdw_cors = () => {
  if (Env.RUNTIME_ENV === "prod" || Env.RUNTIME_ENV === 'stage') {
    return cors({ origin: Env.UI_URL! });
  }

  return cors();
};

export const attach_referer = createMiddleware<{
  Variables: {
    referer?: string;
  };
}>((c, next) => {
  c.set("referer", c.req.header("referer"));
  return next();
});
