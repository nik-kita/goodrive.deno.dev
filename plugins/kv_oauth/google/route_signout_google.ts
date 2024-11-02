import type { PluginRoute } from "$fresh/server.ts";
import { env } from "../../../env.ts";
import { signOut } from "./helpers_google.ts";

export const google_signout_route: PluginRoute = {
  path: env.API_ENDPOINT_AUTH_GOOGLE_SIGNOUT,
  async handler(req) {
    const res = await signOut(req);

    console.log("Sign out response:", res);

    return res;
  },
};
