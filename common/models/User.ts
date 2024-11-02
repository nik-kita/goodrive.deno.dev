import { z } from "zod";

export const User = z.object({
  sub: z.string(),
  google_drive_access_info: z.record(
    z.string().email(),
    z.object({
      access: z.boolean().default(false),
      refresh: z.boolean().default(false),
    }).optional(),
  ),
});

export type User = z.infer<typeof User>;
