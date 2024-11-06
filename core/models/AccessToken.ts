import { z } from "zod";

export const AccessToken = z.object({
  api_access: z.string(),
  email: z.string().email(),
  sub: z.string(),
  by_api_refresh: z.string(),
});

export type AccessToken = z.infer<typeof AccessToken>;
