/// <reference lib="deno.unstable" />
import type { Plugin } from "$fresh/server.ts";
import {
  google_auth_gDrive_helper,
  google_auth_openId_helper,
} from "./google/helpers_google.ts";
import { google_callback_route } from "./google/route_callback_google.ts";
import { google_signin_route } from "./google/route_signin_google.ts";
import { google_signout_route } from "./google/route_signout_google.ts";

export const get_session_id = async (req: Request) => {
  const sessions = await Promise.allSettled([
    google_auth_openId_helper.getSessionId(req),
    google_auth_gDrive_helper.getSessionId(req),
  ]);

  let result: string | undefined = undefined;

  for (const session of sessions) {
    if (session.status === "fulfilled") {
      result = session.value;
      console.log("SessionId:", session.value);
    }
  }

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
