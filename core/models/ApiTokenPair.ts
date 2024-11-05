import { z } from "zod";

export const ApiTokenPair = z.object({
  sub: z.string(),
  email: z.string().email(),
  accesses: z.array(z.string()).default([]),
  refresh: z.union([z.string(), z.null()]).default(null),
});

export type ApiTokenPair = z.infer<typeof ApiTokenPair>;
