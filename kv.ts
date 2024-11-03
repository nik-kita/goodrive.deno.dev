// @ts-types='jsr:@olli/kvdex@1'
import { collection, DenoKv, kvdex } from "@olli/kvdex";
import { openKvToolbox } from "jsr:@kitsonk/kv-toolbox";
import { AppSession } from "./common/models/AppSession.ts";
import { User } from "./common/models/User.ts";

export const kv = await openKvToolbox({});
export const db = kvdex(kv as unknown as DenoKv, {
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
