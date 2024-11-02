// @ts-types='jsr:@olli/kvdex@1'
import { collection, kvdex } from "@olli/kvdex";
import { AppSession } from "./common/models/AppSession.ts";
import { User } from "./common/models/User.ts";

export const kv = await Deno.openKv();

export const db = kvdex(kv, {
  core: {
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
  },
});
