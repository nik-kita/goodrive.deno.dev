import type { PluginRoute } from "$fresh/server.ts";
import { intersect } from "@std/collections";
import { OAuth2Client } from "google-auth-library";
import { GOOGLE_GDRIVE_SCOPES } from "../../../const.ts";
import { db } from "../../../kv.ts";
import { callbackHandler, signIn } from "./helpers_google.ts";

const gClient = new OAuth2Client();

export const handler_callback_google: PluginRoute["handler"] = async (req) => {
  const { response, sessionId, tokens } = await callbackHandler(req);
  const access_token = tokens.accessToken;
  const info = await gClient.getTokenInfo(access_token);

  if (!info.sub) {
    throw new Error("500 handler_callback_google: !info.sub");
  }

  const [user] = await Promise.all([
    db.core.user.findByPrimaryIndex("sub", info.sub).then((res) => res?.value),
    db.core.app_session.add({ session: sessionId, sub: info.sub }),
  ]);

  const is_email = info.email && info.email_verified &&
    info.email.includes("@");
  const is_gDriveAccessExists =
    intersect(info.scopes, GOOGLE_GDRIVE_SCOPES).length > 0;
  const is_refreshTokenExists = !!tokens.refreshToken;

  if (!user) {
    await db.core.user.add({
      sub: info.sub,
      google_drive_access_info: is_email
        ? {
          [info.email!]: {
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
          },
        }
        : {},
    });

    if (is_gDriveAccessExists) {
      console.warn(
        "handler_callback_google: user not found, but has gDrive scopes",
      );

      if (!is_refreshTokenExists) {
        const res_redirect_to_signIn_with_gDrive = await signIn(req, true);

        console.warn("redirecting to signIn with gDrive scopes");
        return res_redirect_to_signIn_with_gDrive;
      }
    }
  } else {
    if (is_gDriveAccessExists) {
      const email = is_email && info.email;
      if (!email) {
        console.warn(
          "handler_callback_google: gDrive scopes without email",
        );
        console.warn("redirecting to signIn with gDrive scopes");

        const res_redirect_to_signIn_with_gDrive2 = await signIn(req, true);

        return res_redirect_to_signIn_with_gDrive2;
      } else if (
        !is_refreshTokenExists &&
        !user.google_drive_access_info[email]?.refresh_token
      ) {
        console.warn(
          "handler_callback_google: user has not refreshToken",
        );
        console.warn("redirecting to signIn with gDrive scopes");

        const res_redirect_to_signIn_with_gDrive3 = await signIn(req, true);

        return res_redirect_to_signIn_with_gDrive3;
      }
    }

    console.debug("handler_callback_google: updating user");
    await db.core.user.updateByPrimaryIndex("sub", user.sub, {
      google_drive_access_info: {
        [info.email!]: {
          access_token: tokens.accessToken,
          ...(is_refreshTokenExists && { refresh_token: tokens.accessToken }),
        },
      },
    }, {
      strategy: "merge",
    });
  }

  return response;
};
