import { z } from "zod";

export const User = z.object({
  sub: z.string(),
  gDrive: z.record(
    z.string().email(),
    z.object({
      access: z.boolean(),
      refresh: z.boolean(),
    }),
  ).optional(),
});

export type User = z.infer<typeof User>;
