import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { Env } from "./env.ts";

export const mdw_cors = () => {
  if (Env.RUNTIME_ENV === "prod") {
    return cors({ origin: Env.UI_URL! });
  }

  return cors();
};

export const attach_origin = createMiddleware<{
  Variables: {
    origin: string;
  };
}>((c, next) => {
  c.set("origin", new URL(c.req.raw.url).origin);
  return next();
});
