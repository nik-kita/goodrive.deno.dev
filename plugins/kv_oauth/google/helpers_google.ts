import { createGoogleOAuthConfig, createHelpers } from "@deno/kv-oauth";
import { GOOGLE_GDRIVE_SCOPES } from "../../../const.ts";
import { env } from "../../../env.ts";

export const {
  getSessionId,
  handleCallback,
  signIn,
  signOut,
} = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: env.API_URL +
      env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_GDRIVE_SCOPES,
  }),
);
