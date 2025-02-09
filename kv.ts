import { z } from "@hono/zod-openapi";
import { openKvToolbox } from "@kitsonk/kv-toolbox";
import { collection, type DenoKv, kvdex } from "@olli/kvdex";

export const Bucket = z.object({
  email: z.string().email(),
  user_id: z.string().uuid(),
  google_drive_authorization: z.object({
    access_token: z.string(),
    refresh_token: z.string(),
  }),
});
export type Bucket = z.infer<typeof Bucket>;
export const User = z.object({
  id: z.string().uuid(),
});
export type User = z.infer<typeof User>;
export const AppSession = z.object({
  session_id: z.string(),
  user_id: z.string(),
});
export type AppSession = z.infer<typeof AppSession>;
export const Secret = z.object({
  api_key: z.string().uuid(),
  email: z.string().email(),
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
});
export type Secret = z.infer<typeof Secret>;
export const kv = await openKvToolbox({});
export const db = kvdex({
  schema: {
    bucket: collection(
      Bucket,
      {
        indices: {
          email: "primary",
          user_id: "secondary",
        },
      },
    ),
    user: collection(
      User,
      {
        indices: {
          id: "primary",
        },
      },
    ),
    app_session: collection(
      AppSession,
    ),
    secret: collection(Secret, {
      indices: {
        api_key: "primary",
        name: "primary",
        email: "secondary",
        user_id: "secondary",
      },
    }),
  },
  kv: kv as unknown as DenoKv,
});
