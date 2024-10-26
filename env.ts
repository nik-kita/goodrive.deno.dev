import { load } from "@std/dotenv";
import { z } from "zod";

export const EnvSchema = z.object({
  API_PORT: z
    .number({ coerce: true })
    .positive()
    .default(3000)
    .describe("Port to run the API on"),
  API_URL: z
    .string()
    .default("http://localhost:3000")
    .describe("Url by which the API is accessible"),
  GOOGLE_CLIENT_ID: z.string().describe("Google OAuth Client ID"),
  GOOGLE_CLIENT_SECRET: z.string().describe("Google OAuth Client Secret"),
  GOOGLE_CALLBACK_URL: z
    .string()
    .default("/api/auth/callback/google")
    .describe("Google OAuth Callback URL"),
});

export type Env = z.infer<typeof EnvSchema>;
export const env = await EnvSchema.parseAsync(await load({ export: true }));
