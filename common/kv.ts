// @ts-types='jsr:@olli/kvdex@1'
import { collection, DenoKv, kvdex } from "@olli/kvdex";
import { openKvToolbox } from "jsr:@kitsonk/kv-toolbox";
import { AccessToken } from "../core/models/AccessToken.ts";
import { AppSession } from "../core/models/AppSession.ts";
import { RefreshToken } from "../core/models/RefreshToken.ts";
import { User } from "../core/models/User.ts";

export const kv = await openKvToolbox({});
export const db = kvdex(kv as unknown as DenoKv, {
  app_session: collection(AppSession, {
    indices: {
      session: "primary",
      sub: "secondary",
    },
  }),
  user: collection(User, {
    indices: {
      sub: "primary",
    },
  }),
  refresh_token: collection(RefreshToken, {
    indices: {
      refresh_token: "primary",
      name: "primary",
      sub: "secondary",
      email: "secondary",
    },
  }),
  access_token: collection(AccessToken, {
    indices: {
      access_token: "primary",
      email: "secondary",
      sub: "secondary",
      by_refresh_token: "secondary",
    },
  }),
});
