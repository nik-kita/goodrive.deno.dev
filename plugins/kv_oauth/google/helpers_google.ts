import { createGoogleOAuthConfig, createHelpers } from "@deno/kv-oauth";
import { GOOGLE_GDRIVE_SCOPES, GOOGLE_OPEN_ID_SCOPE } from "../../../const.ts";
import { env } from "../../../env.ts";

const openId_helper = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: env.API_URL +
      env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_OPEN_ID_SCOPE,
  }),
);

const gDrive_helper = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: env.API_URL +
      env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_GDRIVE_SCOPES,
  }),
);

export const getSessionId = async (req: Request) => {
  const session = await openId_helper.getSessionId(req);
  const session2 = await gDrive_helper.getSessionId(req);

  console.log("=".repeat(20));
  console.log("session", session);
  console.log("session2", session2);
  console.log("=".repeat(20));

  return session;
};

export const signIn = async (req: Request) => {
  const session = await openId_helper.signIn(req);

  if (session) {
    // TODO: check is session is not only exist but is also already fulfilled with gDrive scopes
    const response = await gDrive_helper.signIn(req).then((res) => {
      // TODO: update/replace session with new one
      return res;
    });

    return response;
  }

  const response = await openId_helper.signIn(req);

  return response;
};

export const callbackHandler = async (req: Request) => {
  const session = await openId_helper.getSessionId(req);

  if (session) {
    const response = await gDrive_helper.handleCallback(req).then((res) => {
      // TODO: update/replace session with new one

      return res;
    });

    return response;
  }

  const response = await openId_helper.handleCallback(req);

  return response;
};

export const signOut = async (req: Request) => {
  const response = await openId_helper.signOut(req);

  return response;
};
