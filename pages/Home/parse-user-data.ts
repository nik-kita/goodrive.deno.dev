import { associateBy, deepMerge, mapEntries } from "@std/collections";
import { db } from "../../common/kv.ts";
import { ApiTokenPair } from "../../core/models/ApiTokenPair.ts";
import { User_google_drive_authorization } from "../../core/models/User.ts";
import { IndexState } from "../../routes/_middleware.ts";

export async function parse_user_data(
  { google_drive_authorization, sub }: Exclude<
    Exclude<IndexState["session"], null>["user"],
    null
  >,
) {
  const apiTokenPairs = await db.api_token_pair.findBySecondaryIndex(
    "sub",
    sub,
  ).then((res) => res.result.map((r) => r.value));
  const user_storage_data = deepMerge(
    mapEntries(
      google_drive_authorization,
      ([k, v]) => [k, { ...v, email: k, sub }],
    ),
    associateBy(apiTokenPairs, (p) => p.email),
  ) as Record<string, Partial<User_google_drive_authorization & ApiTokenPair>>;

  return Object.values(user_storage_data);
}
