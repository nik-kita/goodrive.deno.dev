import { z } from "zod";

const PrivateMetaSchema = z.object({
  sub: z.string(),
  gDrive: z.record(
    z.string().email(),
    z.object({
      access_token: z.string().optional(),
      refresh_token: z.string().optional(),
    }),
  ),
});

export type PrivateMeta = z.infer<typeof PrivateMetaSchema>;
