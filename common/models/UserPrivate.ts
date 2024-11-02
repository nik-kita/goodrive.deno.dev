import { z } from "zod";

export const UserPrivate = z.object({
  sub: z.string(),
  gDrivePrivate: z.record(
    z.string().email(),
    z.object({
      access_token: z.string().optional(),
      refresh_token: z.string().optional(),
    }),
  ).optional(),
});

export type UserPrivate = z.infer<typeof UserPrivate>;
