/// <reference lib="deno.unstable" />
import type { Plugin } from "$fresh/server.ts";
import { Env } from "../../common/env.ts";
import { google_authentication_sign_in_handler } from "./google/authentication/sign-in.ts";
import { google_authentication_sign_out_handler } from "./google/authentication/sign-out.ts";
import { google_authentication_cb_handler } from "./google/cb-handler.ts";
import { google_g_drive_authorization_sign_in_handler } from "./google/g-drive-authorization/sign-in.ts";

export const kv_oauth_plugin = () => {
  return {
    name: "kv_oauth",
    routes: [
      {
        path: Env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN,
        handler: google_authentication_sign_in_handler,
      },
      {
        path: Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
        handler: google_authentication_cb_handler,
      },
      {
        path: Env.API_ENDPOINT_AUTH_GOOGLE_SIGNOUT,
        handler: google_authentication_sign_out_handler,
      },
      {
        path: Env.API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE,
        handler: google_g_drive_authorization_sign_in_handler,
      },
    ],
  } as Plugin;
};
