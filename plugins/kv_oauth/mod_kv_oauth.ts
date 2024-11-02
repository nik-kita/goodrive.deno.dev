/// <reference lib="deno.unstable" />
import type { Plugin } from "$fresh/server.ts";
import { getSessionId } from "./google/helpers_google.ts";
import { google_callback_route } from "./google/route_callback_google.ts";
import { google_signin_route } from "./google/route_signin_google.ts";
import { google_signout_route } from "./google/route_signout_google.ts";

export const get_session_id = async (req: Request) => {
  const result = await getSessionId(req);

  return result;
};

export default () => {
  return {
    name: "kv_oauth",
    routes: [
      google_signin_route,
      google_callback_route,
      google_signout_route,
    ],
  } as Plugin;
};
