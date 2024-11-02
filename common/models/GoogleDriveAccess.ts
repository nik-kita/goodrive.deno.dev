import { z } from "zod";

export const GoogleDriveAccess = z.object({
  sub: z.string(),
  email: z.string().email(),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
});

export type GoogleDriveAccess = z.infer<typeof GoogleDriveAccess>;
