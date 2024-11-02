import type { PluginRoute } from "$fresh/server.ts";
import { signOut } from "./helpers_google.ts";

export const handler_signout_google: PluginRoute["handler"] = async (req) => {
  const res = await signOut(req);

  return res;
};
