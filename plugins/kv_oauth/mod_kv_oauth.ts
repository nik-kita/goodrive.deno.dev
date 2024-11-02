/// <reference lib="deno.unstable" />
import type { Plugin } from "$fresh/server.ts";
import { env } from "../../env.ts";
import { handler_callback_google } from "./google/handler_callback_google.ts";
import { handler_signin_google } from "./google/handler_signin_google.ts";
import { handler_signout_google } from "./google/handler_signout_google.ts";
import { getSessionData } from "./google/helpers_google.ts";

export const get_session_id = async (req: Request) => {
  const result = await getSessionData(req);

  return result;
};

export default () => {
  return {
    name: "kv_oauth",
    routes: [
      {
        path: env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN,
        handler: handler_signin_google,
      },
      {
        path: env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
        handler: handler_callback_google,
      },
      {
        path: env.API_ENDPOINT_AUTH_GOOGLE_SIGNOUT,
        handler: handler_signout_google,
      },
    ],
  } as Plugin;
};
