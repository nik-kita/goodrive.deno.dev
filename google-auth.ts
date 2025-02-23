// deno-lint-ignore-file ban-unused-ignore
import {
  Cookie,
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
  GOOGLE_EMAIL_SCOPE,
  GOOGLE_GDRIVE_SCOPES,
  GOOGLE_OFFLINE_CONSENT_PARAMS,
} from "./const.ts";
import { Env } from "./env.ts";
import { HandleCallbackType } from "./types.ts";

const cookieOptions: Partial<Cookie> = {
  domain: Env.UI_URL,
  httpOnly: true,
  sameSite: 'Lax',
  secure: true,
};
const redirectUri = Env.API_URL +
  Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE;
const email = createHelpers(
  createGoogleOAuthConfig({
    redirectUri,
    scope: GOOGLE_EMAIL_SCOPE,
  }),
  {
    cookieOptions,
  },
) as Omit<Helpers, "handleCallback"> & {
  handleCallback: HandleCallbackType;
};

const google_drive = createHelpers(
  createGoogleOAuthConfig({
    redirectUri,
    scope: GOOGLE_GDRIVE_SCOPES.concat(GOOGLE_EMAIL_SCOPE),
  }),
  {
    cookieOptions,
  },
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
    const redirect = new Request(req.url, {
      headers: {
        ...req.headers,
        'Authorization': `Bearer ${options.access_token}`,
      },
      method: req.method,
    })
    return google_drive.signIn(redirect, {
      urlParams: {
        ...GOOGLE_OFFLINE_CONSENT_PARAMS,
        include_granted_scopes: "false",
        login_hint: options.email,
      }
    });
  },
  sign_out: email.signOut,
  get_session_id: email.getSessionId,
  handle_cb: email.handleCallback,
};
