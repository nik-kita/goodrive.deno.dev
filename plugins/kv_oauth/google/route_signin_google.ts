import type { PluginRoute } from "$fresh/server.ts";
import { env } from "../../../env.ts";
import {
  google_auth_gDrive_helper,
  google_auth_openId_helper,
} from "./helpers_google.ts";

export const google_signin_route: PluginRoute = {
  path: env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN,
  async handler(req) {
    const session = await google_auth_openId_helper.getSessionId(req);

    if (session) {
      const gDrive_res = await google_auth_gDrive_helper.signIn(req);

      return gDrive_res;
    }

    const res = await google_auth_openId_helper.signIn(req, {
      urlParams: {
        access_type: "offline",
        prompt: "consent",
      },
    });

    return res;
  },
};
