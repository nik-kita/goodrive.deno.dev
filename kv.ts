// @ts-types='jsr:@olli/kvdex@1'
import { collection, kvdex } from "@olli/kvdex";
import { User } from "./common/models/User.ts";
import { UserPrivate } from "./common/models/UserPrivate.ts";
import { UserSession } from "./common/models/UserSession.ts";

export const kv = await Deno.openKv();

export const db = kvdex(kv, {
  user: {
    session: collection(UserSession, {
      indices: {
        session: "primary",
        sub: "secondary",
      },
    }),
    public: collection(User, {
      indices: {
        sub: "primary",
      },
    }),
    private: collection(UserPrivate, {
      indices: {
        sub: "primary",
      },
    }),
  },
});
