export { OAUTH_COOKIE_NAME } from "https://jsr.io/@deno/kv-oauth/0.11.0/lib/_http.ts";
export const GOOGLE_OPEN_ID_SCOPE = "openid";
export const GOOGLE_GDRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
];
export const GOOGLE_EMAIL_SCOPE = "email";
export const GOOGLE_OFFLINE_CONSENT_PARAMS = {
  access_type: "offline",
  prompt: "consent",
};

export type GoogleAuthJwtPayload = {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
};
