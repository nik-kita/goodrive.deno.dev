import { OAuth2Client } from "google-auth-library";
import { Env } from "./env.ts";

const google_oauth2_client = new OAuth2Client({
  clientId: Env.GOOGLE_CLIENT_ID,
  clientSecret: Env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${Env.API_URL}${Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE}`,
});

export const google_sign_in_url = (
  params: {
    scope: string[];
    state: string;
    login_hint?: string;
    include_granted_scopes?: boolean;
    access_type?: "offline";
  },
) => {
  const uri = google_oauth2_client.generateAuthUrl({
    include_granted_scopes: true,
    prompt: "consent",
    ...params,
  });

  return uri;
};

export const google_process_cb_data = async (code: string) => {
  const payload = await google_oauth2_client.getToken(code);

  if (!payload.tokens.access_token) {
    throw new Error(`Unable to process data from google <code> ${code}`);
  }

  const info = await google_oauth2_client.getTokenInfo(
    payload.tokens.access_token,
  );

  return {
    payload,
    info,
  };
};
export type ResultGoogleCpDataProcessing = Awaited<
  ReturnType<typeof google_process_cb_data>
>;
