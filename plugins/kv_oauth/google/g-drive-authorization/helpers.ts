import { createGoogleOAuthConfig, createHelpers } from "@deno/kv-oauth";
import {
  GOOGLE_EMAIL_SCOPE,
  GOOGLE_GDRIVE_SCOPES,
  GOOGLE_OFFLINE_CONSENT_PARAMS,
} from "../../../../const.ts";
import { Env } from "../../../../common/env.ts";
import { HandleCallbackType } from "../../../../common/types.ts";

const helpers = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: Env.API_URL +
      Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_GDRIVE_SCOPES.concat(GOOGLE_EMAIL_SCOPE),
  }),
);
const _handleCallback = helpers.handleCallback;

const handleCallback = _handleCallback as HandleCallbackType;
const signIn = (req: Request) =>
  helpers.signIn(req, {
    urlParams: GOOGLE_OFFLINE_CONSENT_PARAMS,
  });
const {
  getSessionId,
  signOut,
} = helpers;

export const google_g_drive_authorization_helpers = {
  handleCallback,
  signIn,
  getSessionId,
  signOut,
};
