import { deepMerge, mapEntries } from "@std/collections";
import { db } from "../../common/kv.ts";
import { RefreshToken } from "../../core/models/RefreshToken.ts";
import { User_google_drive_authorization } from "../../core/models/User.ts";
import { IndexState } from "../../routes/_middleware.ts";

export async function parse_user_data(
  { google_drive_authorization, sub }: Exclude<
    Exclude<IndexState["session"], null>["user"],
    null
  >,
) {
  const apiRefreshes = await db.refresh_token.findBySecondaryIndex(
    "sub",
    sub,
  ).then((res) => res.result.map((r) => r.value));
  const user_storage_data = deepMerge(
    mapEntries(
      google_drive_authorization,
      ([k, v]) => [k, { ...v, email: k, sub }],
    ),
    apiRefreshes.reduce((acc, t) => {
      return deepMerge(acc, { [t.email]: { api_info: [t] } }, {
        arrays: "merge",
      });
    }, {} as Record<string, { api_info: RefreshToken[] }>),
  ) as Record<
    string,
    Partial<
      User_google_drive_authorization & { api_info: RefreshToken[] } & {
        sub: string;
        email: string;
      }
    >
  >;

  return Object.values(user_storage_data);
}
