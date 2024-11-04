import { type Handler } from "$fresh/server.ts";

export type AppState = {
  origin: string;
};

const attach_request_origin: Handler<unknown, AppState> = (
  req,
  c,
) => {
  console.group("middleware: attach_request_origin");
  if (c.destination !== "route" || c.remoteAddr.transport !== "tcp") {
    console.groupEnd();
    return c.next();
  }

  const origin = req.headers.get("origin") || req.headers.get("referer") || "/";

  c.state.origin = origin;

  console.log(origin);
  console.groupEnd();
  return c.next();
};

export const handler = [
  attach_request_origin,
];
