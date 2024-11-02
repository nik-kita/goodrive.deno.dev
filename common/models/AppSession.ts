import { z } from "zod";

export const AppSession = z.object({
  session: z.string(),
  sub: z.string(),
});

export type AppSession = z.infer<typeof AppSession>;
