import { google_g_drive_authorization_helpers } from "./helpers.ts";

export const google_g_drive_authorization_sign_in_handler = async (
  req: Request,
) => {
  const res = await google_g_drive_authorization_helpers.signIn(req);

  return res;
};
