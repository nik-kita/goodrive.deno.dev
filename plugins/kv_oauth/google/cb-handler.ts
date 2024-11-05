import { intersect } from "@std/collections";
import { db } from "../../../common/kv.ts";
import { Tokens } from "../../../common/types.ts";
import { GOOGLE_GDRIVE_SCOPES } from "../../../const.ts";
import { User } from "../../../core/models/User.ts";
import { google_authentication_helpers } from "./authentication/helpers.ts";
import { gClient } from "./g-client.ts";
import { google_g_drive_authorization_sign_in_handler } from "./g-drive-authorization/sign-in.ts";

export const google_authentication_cb_handler = async (req: Request) => {
  const { response, sessionId, tokens } = await google_authentication_helpers
    .handleCallback(req);
  const access_token = tokens.accessToken;
  const info = await gClient.getTokenInfo(access_token);

  if (!info.sub) {
    throw new Error("500: !info.sub");
  }

  const [user] = await Promise.all([
    db.user.findByPrimaryIndex("sub", info.sub).then((res) =>
      res?.value || null
    ),
    db.app_session.add({ session: sessionId, sub: info.sub }),
  ]);

  const email = info.email && info.email_verified &&
      info.email.includes("@")
    ? info.email
    : null;
  const is_g_drive_scopes_present =
    intersect(info.scopes, GOOGLE_GDRIVE_SCOPES).length > 0;

  if (
    is_g_drive_scopes_present &&
    is_redirect_to_sign_in_with_g_drive_offline_scopes_required(
      user,
      tokens,
      email,
    )
  ) {
    const redirect_to_g_drive_sign_in =
      await google_g_drive_authorization_sign_in_handler(req);

    return redirect_to_g_drive_sign_in;
  }

  const google_drive_authorization_for_current_email =
    (is_g_drive_scopes_present &&
        email)
      ? {
        access_token: tokens.accessToken,
        ...(tokens.refreshToken && { refresh_token: tokens.refreshToken }),
      }
      : undefined;
  const google_drive_authorization = {
    ...user?.google_drive_authorization,
    ...(google_drive_authorization_for_current_email && {
      [email!]: {
        ...user?.google_drive_authorization[email!],
        ...google_drive_authorization_for_current_email,
      },
    }),
  };

  await db.user.upsertByPrimaryIndex({
    index: ["sub", info.sub],
    set: {
      sub: info.sub,
      google_drive_authorization,
    },
    update: {
      google_drive_authorization,
    },
  });

  return response;
};

function is_redirect_to_sign_in_with_g_drive_offline_scopes_required(
  user: User | null,
  tokens: Tokens,
  email: string | null,
) {
  if (!email) {
    return true;
  } else if (tokens.refreshToken) {
    return false;
  } else if (!user) {
    return true;
  } else if (!user.google_drive_authorization[email]?.refresh_token) {
    return true;
  }

  return false;
}
