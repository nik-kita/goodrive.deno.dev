import { createGoogleOAuthConfig, createHelpers } from "@deno/kv-oauth";
import {
  GOOGLE_GDRIVE_SCOPES,
  GOOGLE_OPEN_ID_SCOPE,
  GOOGLE_USERINFO_SCOPES,
} from "../../../const.ts";
import { env } from "../../../env.ts";
import { db } from "../../../kv.ts";
import { Tokens_deno_land_x_oauth2_client } from "../../../types.ts";

const OFFLINE_PARAMS = {
  access_type: "offline",
  prompt: "consent",
};

const oid_auth_helper = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: env.API_URL +
      env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_OPEN_ID_SCOPE,
  }),
);

const gDrive_auth_helper = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: env.API_URL +
      env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_GDRIVE_SCOPES.concat(GOOGLE_USERINFO_SCOPES),
  }),
);

export const signIn = async (req: Request, with_gDrive_scopes = false) => {
  const res = with_gDrive_scopes
    ? await gDrive_auth_helper.signIn(req, {
      urlParams: OFFLINE_PARAMS,
    })
    : await oid_auth_helper.signIn(req);

  return res;
};

export const getSessionData = async (req: Request) => {
  const sessionId = await oid_auth_helper.getSessionId(req);

  if (!sessionId) {
    return null;
  }

  const user = await db.core.app_session.findByPrimaryIndex(
    "session",
    sessionId,
  ).then(async (appSessionRes) => {
    if (!appSessionRes?.value) {
      return null;
    }

    const user = await db.core.user.findByPrimaryIndex(
      "sub",
      appSessionRes.value.sub,
    ).then((userRes) => userRes?.value);

    return user;
  });

  if (!user) {
    console.warn("sessionId && !appSession");
    return {
      sessionId: null,
      forceSignIn: () => {
        console.warn("forceSignIn()");
        return signIn(req);
      },
    };
  }

  return {
    sessionId,
    user,
  };
};

export const callbackHandler = async (req: Request) => {
  const response = await oid_auth_helper.handleCallback(req);

  return response as T_handleCallback_result;
};

export const signOut = async (req: Request) => {
  const res = await oid_auth_helper.signOut(req);

  return res;
};

type T_handleCallback_origin_result = Awaited<
  ReturnType<typeof oid_auth_helper.handleCallback>
>;
type T_handleCallback_result =
  & Omit<
    T_handleCallback_origin_result,
    keyof Pick<T_handleCallback_origin_result, "tokens">
  >
  & {
    tokens: Tokens_deno_land_x_oauth2_client;
  };
