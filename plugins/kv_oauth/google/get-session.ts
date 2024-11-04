import { db } from "../../../common/kv.ts";
import { google_authentication_helpers } from "./authentication/helpers.ts";

export const get_session = async (req: Request) => {
  const session_id = await google_authentication_helpers.getSessionId(req);

  if (!session_id) {
    return null;
  }

  const user = await db.app_session.findByPrimaryIndex(
    "session",
    session_id,
  ).then(async (res) => {
    if (!res?.value) {
      return null;
    }

    const user_res = await db.user.findByPrimaryIndex(
      "sub",
      res.value.sub,
    );

    if (!user_res?.value) {
      return null;
    }

    return user_res.value;
  });

  return {
    session_id,
    user,
  };
};
