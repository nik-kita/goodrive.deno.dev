import { z } from "zod";

export const UserSession = z.object({
  session: z.string(),
  sub: z.string(),
});

export type UserSession = z.infer<typeof UserSession>;
