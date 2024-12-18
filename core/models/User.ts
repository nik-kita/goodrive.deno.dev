import { z } from "zod";

export const User = z.object({
  sub: z.string(),
  google_drive_authorization: z.record(
    z.string().email(),
    z.object({
      access_token: z.string().optional(),
      refresh_token: z.string().optional(),
    }).optional(),
  ),
});

export type User = z.infer<typeof User>;
export type User_google_drive_authorization =
  User["google_drive_authorization"][string];
