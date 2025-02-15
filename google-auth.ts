// deno-lint-ignore-file ban-unused-ignore
import {
  createGoogleOAuthConfig,
  createHelpers,
  Helpers,
} from "@deno/kv-oauth";

/// for incremental onfly authorization we need pass 2nd param that is exist in this version
/// though it is marked as deprecated
/// that'is why is imported separatly with hardcoded version
/// and why TODO: monitor/explore/find/develop better solution
import { OAuth2Client } from "google-auth-library";
import {
  // deno-lint-ignore no-unused-vars
  signIn as internal_signIn,
} from "jsr:@deno/kv-oauth@0.11.0";
import {
  GOOGLE_EMAIL_SCOPE,
  GOOGLE_GDRIVE_SCOPES,
  GOOGLE_OFFLINE_CONSENT_PARAMS,
} from "./const.ts";
import { Env } from "./env.ts";
import { HandleCallbackType } from "./types.ts";

const redirectUri = Env.API_URL +
  Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE;
const email = createHelpers(
  createGoogleOAuthConfig({
    redirectUri,
    scope: GOOGLE_EMAIL_SCOPE,
  }),
) as Omit<Helpers, "handleCallback"> & {
  handleCallback: HandleCallbackType;
};

const google_drive = createHelpers(
  createGoogleOAuthConfig({
    redirectUri,
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

  google_drive_sign_in_incremental: (req: Request, options: {
    email: string;
    access_token: string;
  }) => {
    return internal_signIn(req, {
      defaults: {
        scope: GOOGLE_GDRIVE_SCOPES,
        requestOptions: {
          headers: {
            Authorization: `Bearer ${options.access_token}`,
          },
        },
      },
      redirectUri,
      clientSecret: Env.GOOGLE_CLIENT_SECRET,
      clientId: Env.GOOGLE_CLIENT_ID,
      authorizationEndpointUri: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUri: "https://oauth2.googleapis.com/token",
    }, {
      urlParams: {
        ...GOOGLE_OFFLINE_CONSENT_PARAMS,
        include_granted_scopes: "false",
        login_hint: options.email,
      },
    });
  },
  sign_out: email.signOut,
  get_session_id: email.getSessionId,
  handle_cb: email.handleCallback,
};
