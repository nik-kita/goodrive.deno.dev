import { FreshContext } from "$fresh/server.ts";

export type ApiState = _StateWithOrigin;

export const handler = [
  attach_request_origin_to_context,
];

type _StateWithOrigin = {
  origin: string;
};

async function attach_request_origin_to_context(
  req: Request,
  c: FreshContext<_StateWithOrigin>,
) {
  if (
    c.destination === "route" &&
    c.remoteAddr.transport === "tcp"
  ) {
    const origin = req.headers.get("origin") ||
      req.headers.get("referer") ||
      "/";

    c.state.origin = origin;
  }

  return await c.next();
}
