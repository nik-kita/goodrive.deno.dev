import type { PluginRoute } from "$fresh/server.ts";
import { env } from "../../../env.ts";
import {
  google_auth_gDrive_helper,
  google_auth_openId_helper,
} from "./helpers_google.ts";

export const google_signout_route: PluginRoute = {
  path: env.API_ENDPOINT_AUTH_GOOGLE_SIGNOUT,
  async handler(req) {
    const simple_session = await google_auth_openId_helper.getSessionId(req);

    const signOut = simple_session
      ? google_auth_gDrive_helper.signOut
      : google_auth_openId_helper.signOut;

    return await signOut(req);
  },
};
