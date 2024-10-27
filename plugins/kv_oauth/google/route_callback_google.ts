import type { PluginRoute } from "$fresh/server.ts";
import { env } from "../../../env.ts";
import { handleCallback } from "./helpers_google.ts";

class Tokens {
  accessToken!: string;
  tokenType!: string;
  refreshToken?: string;
  expiresIn!: number;
  scope!: string[];

  static should_be(tokens: unknown): Tokens {
    const ok = typeof tokens === "object" && tokens !== null &&
      "accessToken" in tokens && "tokenType" in tokens &&
      "expiresIn" in tokens && "scope" in tokens;

    if (!ok) {
      throw new Error("Invalid tokens");
    }

    return tokens as Tokens;
  }
}

export const google_callback_route: PluginRoute = {
  path: env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
  async handler(req) {
    const { response, sessionId, tokens } = await handleCallback(req);
    console.log(tokens, sessionId);
    return response;
  },
};
