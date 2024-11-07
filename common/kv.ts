// @ts-types='jsr:@olli/kvdex@1'
import { collection, DenoKv, kvdex } from "@olli/kvdex";
import { openKvToolbox } from "jsr:@kitsonk/kv-toolbox";
import { AppSession } from "../core/models/AppSession.ts";
import { ApiKey } from "../core/models/ApiKey.ts";
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
  api_key: collection(ApiKey, {
    indices: {
      api_key: "primary",
      name: "primary",
      sub: "secondary",
      email: "secondary",
    },
  }),
});
