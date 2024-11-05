import { z } from "zod";

export const ApiTokenPair = z.object({
  sub: z.string(),
  email: z.string().email(),
  access_tokens: z.array(z.string()).default([]),
  refresh_token: z.union([z.string(), z.null()]).default(null),
});
