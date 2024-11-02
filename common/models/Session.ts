import { z } from "zod";

const SessionSchema = z.object({
  session: z.string().optional(),
  user: z.object({
    sub: z.string(),
    gDrive: z.record(
      z.string().email(),
      z.object({
        access: z.boolean().default(false),
        refresh: z.boolean().default(false),
      }),
    ),
  }),
});

export type Session = z.infer<typeof SessionSchema>;
