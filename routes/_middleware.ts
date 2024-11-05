import { FreshContext } from "$fresh/server.ts";
import { google_authentication_sign_out_handler } from "../plugins/kv_oauth/google/authentication/sign-out.ts";
import { get_session } from "../plugins/kv_oauth/google/get-session.ts";

export const handler = [
  attach_session_to_context,
  attach_request_origin_to_context,
];
export type AppState = _StateWithOrigin & _StateWithSession;

type _StateWithOrigin = {
  origin: string;
};

async function attach_request_origin_to_context(
  req: Request,
  c: FreshContext<_StateWithOrigin>,
) {
  if (
    c.route.startsWith("/api") && c.destination === "route" &&
    c.remoteAddr.transport === "tcp"
  ) {
    return await c.next();
  }

  const origin = req.headers.get("origin") || req.headers.get("referer") || "/";

  c.state.origin = origin;

  return await c.next();
}

type _StateWithSession = {
  session: Required<Awaited<ReturnType<typeof get_session>>> | null;
};

async function attach_session_to_context(
  req: Request,
  c: FreshContext<_StateWithSession>,
) {
  if (c.route.startsWith("/api") || c.destination !== "route") {
    return await c.next();
  }

  const sessionData = await get_session(req);

  if (!sessionData) {
    c.state.session = null;
  } else if (sessionData.user) {
    c.state.session = sessionData;
  } else {
    return await google_authentication_sign_out_handler(req);
  }

  return await c.next();
}
