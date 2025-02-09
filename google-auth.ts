import {
  createGoogleOAuthConfig,
  createHelpers,
  Helpers,
} from "@deno/kv-oauth";
import { OAuth2Client } from "google-auth-library";
import {
  GOOGLE_EMAIL_SCOPE,
  GOOGLE_GDRIVE_SCOPES,
  GOOGLE_OFFLINE_CONSENT_PARAMS,
} from "./const.ts";
import { Env } from "./env.ts";
import { HandleCallbackType } from "./types.ts";

const email = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: Env.API_URL +
      Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_EMAIL_SCOPE,
  }),
) as Omit<Helpers, "handleCallback"> & {
  handleCallback: HandleCallbackType;
};

const google_drive = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: Env.API_URL +
      Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_GDRIVE_SCOPES.concat(GOOGLE_EMAIL_SCOPE),
  }),
);

export const GoogleAuth = {
  oauth2_client: new OAuth2Client(),
  email_sign_in: email.signIn,
  google_drive_sign_in: (req: Request) =>
    google_drive.signIn(req, {
      urlParams: GOOGLE_OFFLINE_CONSENT_PARAMS,
    }),
  sign_out: email.signOut,
  get_session_id: email.getSessionId,
  handle_cb: email.handleCallback,
};
