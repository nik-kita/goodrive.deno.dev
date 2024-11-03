import { google_authentication_helpers } from "./helpers.ts";

export const google_authentication_sign_in_handler = async (req: Request) => {
  const res = await google_authentication_helpers.signIn(req);

  return res;
};
