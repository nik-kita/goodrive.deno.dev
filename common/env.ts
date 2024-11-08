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
  API_ENDPOINT_AUTH_GOOGLE_SIGNIN: z.string().default("/api/auth/signin/google")
    .describe("Google OAuth Signin Endpoint"),
  API_ENDPOINT_AUTH_GOOGLE_SIGNOUT: z.string().default(
    "/api/auth/signout/google",
  )
    .describe("Google OAuth Signout Endpoint"),
  API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE: z.string().default(
    "/api/auth/authorization/google-drive",
  ),
  API_ENDPOINT_AUTH_CALLBACK_GOOGLE: z
    .string()
    .regex(/google-callback/)
    .default("/api/auth/google-callback")
    .describe("Google OAuth Callback URL"),
  GOOGLE_CLIENT_ID: z.string().describe("Google OAuth Client ID"),
  GOOGLE_CLIENT_SECRET: z.string().describe("Google OAuth Client Secret"),
});
const deno_env = Deno.env.toObject();

export type Env = z.infer<typeof EnvSchema>;
export const Env = await EnvSchema.parseAsync({
  ...deno_env,
  ...await load(),
});
