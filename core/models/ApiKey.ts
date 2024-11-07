import { z } from "zod";

export const ApiKey = z.object({
  api_key: z.string().uuid(),
  email: z.string().email(),
  sub: z.string(),
  expiration_time: z.number().positive().optional(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type ApiKey = z.infer<
  typeof ApiKey
>;
