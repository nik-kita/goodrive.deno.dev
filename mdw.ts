import { SECOND } from "@std/datetime";
import { deleteCookie, getCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { AppCtx, AUTH_COOKIE_NAME } from "./const.ts";
import { Env } from "./env.ts";
import { AppSession, db } from "./kv.ts";

export const mdw_cors = () => {
  if (Env.RUNTIME_ENV === "prod" || Env.RUNTIME_ENV === "stage") {
    return cors({ origin: Env.UI_URL! });
  }

  return cors();
};

export type mdw_authentication = AppCtx<
  {
    auth: {
      as: "guest";
    } | {
      as: "user";
      session: AppSession;
    };
  }
>;
export const mdw_authentication = createMiddleware<
  mdw_authentication
>(async (c, next) => {
  console.warn(1.1);
  console.log(Array.from(c.req.raw.headers.entries()).join())
  const auth_cookie = getCookie(c, AUTH_COOKIE_NAME);

  if (!auth_cookie) {
    console.log(1.2)
    try {
      c.set("auth", { as: "guest" });
    } catch (err) {
      console.log('error c.set', err);
      return c.text('ooops');
    }
    console.log(1.3)

    await next();

    console.log(1.4)

    return;
  }

  const prev_session = await db.app_session.findByPrimaryIndex(
    "session_id",
    auth_cookie,
  )
    .then((r) => r?.value || null);

  if (!prev_session) {
    console.warn(
      `On practice such case should not be possible... if !prev_session in ${import.meta.filename}`,
    );
    console.log(1.5)

    deleteCookie(c, AUTH_COOKIE_NAME);
    c.set("auth", { as: "guest" });

    await next();

    return;
  }

  const now = new Date();
  const is_active_session = prev_session.updated_at.getTime() +
    Env.AUTH_SESSION_MAX_SILENCE_DURATION_IN_SECONDS * SECOND >
    now.getTime();

  if (!is_active_session) {
    console.log(1.6);
    deleteCookie(c, AUTH_COOKIE_NAME);
    c.set("auth", { as: "guest" });

    await Promise.all([
      next(),
      db.app_session.deleteByPrimaryIndex(
        "session_id",
        prev_session.session_id,
      ),
    ]);

    return;
  }

  c.set("auth", { as: "user", session: prev_session });

  await Promise.all([
    db.app_session.updateByPrimaryIndex(
      "session_id",
      prev_session.session_id,
      { updated_at: now },
      { strategy: "merge-shallow" },
    ),
    next(),
  ]);

  return;
});

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
      const _err = err as Record<string, unknown> || undefined;
      const error_name = _err?.name || "something-wrong";
      const message = _err?.message || "oops";
      const details = _err?.details || "unknown";
      const cause = _err?.cause || "unknown";

      return c.redirect(
        new URL(Env.UI_URL!).origin +
        `/500?name=${error_name}&message=${message}&cause=${cause}&details=${details}`,
      );
    }
  },
);
