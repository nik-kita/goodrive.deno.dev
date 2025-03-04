const EmptyObj = {};
export type EmptyObj = typeof EmptyObj;

export const GOOGLE_OPEN_ID_SCOPE = "openid";
export const GOOGLE_GDRIVE_SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
];
export const GOOGLE_EMAIL_SCOPE = "email";
export const GOOGLE_OFFLINE_CONSENT_PARAMS = {
    access_type: "offline",
    prompt: "consent",
};
export const AUTH_COOKIE_NAME = "auth";

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

export type AppCtx<T extends object = Record<string, unknown>> = {
    Variables: EmptyObj & T;
};

export type Bucket = {
    __typename: "Bucket";
    user_id: string;
    email: string;
    access_token: string;
    refresh_token: string;
};
export type User = {
    __typename: "User";
    id: string;
    buckets: Map<string, Bucket>;
};
export type Session =
    & {
        __typename: "Session";
        id: string;
        email?: string | undefined | never;
        user_id?: string | undefined | never;
    }
    & (
        | {
            _tag: "Session::unknown";
            email?: never;
            user_id?: never;
        }
        | {
            _tag: "Session::candidate";
            email: string;
            user_id?: never;
        }
        | {
            _tag: "Session::normal";
            user_id: string;
            email: string;
        }
    );
