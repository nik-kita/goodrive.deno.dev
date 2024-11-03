import { google_authentication_helpers } from "./helpers.ts";

export const google_authentication_sign_out_handler = async (req: Request) => {
  const res = await google_authentication_helpers.signOut(req);

  return res;
};
