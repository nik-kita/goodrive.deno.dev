import type { PluginRoute } from "$fresh/server.ts";
import { OAuth2Client } from "google-auth-library";
import { env } from "../../../env.ts";
import {
  google_auth_gDrive_helper,
  google_auth_openId_helper,
} from "./helpers_google.ts";

const gClient = new OAuth2Client();

export const google_callback_route: PluginRoute = {
  path: env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
  async handler(req) {
    const simple_session = await google_auth_openId_helper.getSessionId(req);

    const handleCallback = simple_session
      ? google_auth_gDrive_helper.handleCallback
      : google_auth_openId_helper.handleCallback;

    const { response, sessionId, tokens } = await handleCallback(req);
    const access_token = tokens.accessToken as string;
    const info = await gClient.getTokenInfo(access_token);

    console.log("Tokens:", tokens);
    console.log("SessionId:", sessionId);
    console.log("Google token info:", info);
    console.log("// TODO", "Save the token to KV store");

    return response;
  },
};
