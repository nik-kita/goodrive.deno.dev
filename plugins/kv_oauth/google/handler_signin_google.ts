import type { PluginRoute } from "$fresh/server.ts";
import { signIn } from "./helpers_google.ts";

export const handler_signin_google: PluginRoute["handler"] = async (req) => {
  const res = await signIn(req);

  return res;
};
