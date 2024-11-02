import type { PluginRoute } from "$fresh/server.ts";
import { OAuth2Client } from "google-auth-library";
import { db } from "../../../kv.ts";
import { callbackHandler } from "./helpers_google.ts";

const gClient = new OAuth2Client();

export const handler_callback_google: PluginRoute["handler"] = async (req) => {
  const { response, sessionId, tokens } = await callbackHandler(req);
  const access_token = tokens.accessToken;
  const info = await gClient.getTokenInfo(access_token);

  if (!info.sub) {
    throw new Error(
      "handler_callback_google: !info.sub => unexpected sub absence",
    );
  }

  const user = await db.user.public.findByPrimaryIndex("sub", info.sub);

  if (!user) {
    await Promise.all([
      db.user.public.add({
        sub: info.sub,
      }),
      db.user.private.add({
        sub: info.sub,
      }),
      db.user.session.add({ session: sessionId, sub: info.sub }),
    ]);
  } else if (!info.email) {
    throw new Error(
      "handler_callback_google: user && !info.email => unexpected email absence",
    );
  } else {
    // TODO
  }

  return response;
};
