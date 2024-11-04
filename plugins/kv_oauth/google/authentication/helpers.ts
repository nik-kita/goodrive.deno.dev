import { createGoogleOAuthConfig, createHelpers } from "@deno/kv-oauth";
import { GOOGLE_OPEN_ID_SCOPE } from "../../../../const.ts";
import { Env } from "../../../../common/env.ts";
import { HandleCallbackType } from "../../../../common/types.ts";

const helpers = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: Env.API_URL +
      Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_OPEN_ID_SCOPE,
  }),
);
const _handleCallback = helpers.handleCallback;

const handleCallback = _handleCallback as HandleCallbackType;
const {
  signIn,
  getSessionId,
  signOut,
} = helpers;

export const google_authentication_helpers = {
  signIn,
  handleCallback,
  getSessionId,
  signOut,
};
