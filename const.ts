export const GOOGLE_GDRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "openid",
  "email",
];

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
