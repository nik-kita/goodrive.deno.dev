import { Context } from "hono";
import { deleteCookie } from "hono/cookie";

export const clean_auth_cookies = (c: Context) => {
  deleteCookie(c, "auth");
};
