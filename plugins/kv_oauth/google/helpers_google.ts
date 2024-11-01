import { createGoogleOAuthConfig, createHelpers } from "@deno/kv-oauth";
import { GOOGLE_GDRIVE_SCOPES, GOOGLE_OPEN_ID_SCOPE } from "../../../const.ts";
import { env } from "../../../env.ts";

export const google_auth_openId_helper = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: env.API_URL +
      env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_OPEN_ID_SCOPE,
  }),
);

export const google_auth_gDrive_helper = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: env.API_URL +
      env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_GDRIVE_SCOPES,
  }),
);
