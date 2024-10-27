import type { PluginRoute } from "$fresh/server.ts";
import { env } from "../../../env.ts";
import { signIn } from "./helpers_google.ts";

export const google_signin_route: PluginRoute = {
  path: env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN,
  async handler(req) {
    const res = await signIn(req, {
      urlParams: {
        access_type: "offline",
        prompt: "consent",
      },
    });

    return res;
  },
};
