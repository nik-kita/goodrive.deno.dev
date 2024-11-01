export const GOOGLE_OPEN_ID_SCOPE = "openid";
export const GOOGLE_GDRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"];
export const GOOGLE_USERINFO_SCOPES = "email";

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
