import { createGoogleOAuthConfig, createHelpers } from "@deno/kv-oauth";
import { GOOGLE_GDRIVE_SCOPES, GOOGLE_OPEN_ID_SCOPE } from "../../../const.ts";
import { env } from "../../../env.ts";
import { db } from "../../../kv.ts";
import { Tokens_deno_land_x_oauth2_client } from "../../../types.ts";

const oid = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: env.API_URL +
      env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_OPEN_ID_SCOPE,
  }),
);

const gDrive = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: env.API_URL +
      env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
    scope: GOOGLE_GDRIVE_SCOPES,
  }),
);

export const getSessionData = async (req: Request) => {
  const [oidS, gDriveS] = await Promise.all([
    oid.getSessionId(req),
    gDrive.getSessionId(req),
  ]);

  if (oidS !== gDriveS) {
    throw new Error("oid !== gDrive => incorrect sessions understanding");
  } else if (!oidS) {
    return null;
  }

  const appSession = await db.user.session.findByPrimaryIndex("session", oidS);

  if (!appSession?.value) {
    throw new Error(
      "!user?.value => unexpected app-session (db record) absence",
    );
  }

  const user = await db.user.public.findByPrimaryIndex(
    "sub",
    appSession.value.sub,
  );

  if (!user?.value) {
    throw new Error("!user?.value => unexpected user absence");
  }

  return {
    session: oidS,
    user: user.value,
  };
};

export const signIn = async (req: Request) => {
  const data = await getSessionData(req);

  if (!data) {
    const response = await oid.signIn(req);

    return response;
  }

  // deno-lint-ignore no-unused-vars
  const { session, user } = data;
  // TODO: check is session is not only exist but is also already fulfilled with gDrive scopes
  const response = await gDrive.signIn(req).then((res) => {
    return res;
  });

  return response;
};

export const callbackHandler = async (req: Request) => {
  const response = await oid.handleCallback(req);

  return response as T_handleCallback_result;
};

export const signOut = async (req: Request) => {
  const data = await getSessionData(req);

  if (!data || !data.user || !data.session) {
    console.warn(
      "singOut(): !data => unexpected session-data absence",
    );

    return await oid.signOut(req);
  }

  return await oid.signOut(req);
};

type T_handleCallback_origin_result = Awaited<
  ReturnType<typeof oid.handleCallback>
>;
type T_handleCallback_result =
  & Omit<
    T_handleCallback_origin_result,
    keyof Pick<T_handleCallback_origin_result, "tokens">
  >
  & {
    tokens: Tokens_deno_land_x_oauth2_client;
  };
