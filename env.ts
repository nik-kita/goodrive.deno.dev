import { load } from "@std/dotenv";
import { z } from "zod";

await load({ export: true });

export const EnvSchema = z.object({
  RUNTIME_ENV: z.enum(["prod", "stage", "local"]).default("local"),
  API_PORT: z
    .number({ coerce: true })
    .positive()
    .default(3000)
    .describe("Port to run the API on"),
  API_URL: z
    .string()
    .default("http://localhost:3000")
    .describe("Url by which the API is accessible"),
  UI_SUCCESS_LOGIN_ENDPOINT: z
    .string()
    .describe(
      "The endpoint where user will be redirected after success sing-in",
    )
    .default("/dashbord"),
  UI_URL: z
    .string()
    .optional()
    .describe("Url by which the UI is accessible (can be dynamic)"),
  API_ENDPOINT_AUTH_GOOGLE_SIGNIN: z.string().default("/api/auth/google-email")
    .describe("Google OAuth Signin Endpoint"),
  API_ENDPOINT_AUTH_GOOGLE_SIGNOUT: z.string().default(
    "/api/auth/google-signout",
  )
    .describe("Google OAuth Signout Endpoint"),
  API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE: z.string().default(
    "/api/auth/google-drive",
  ),
  API_ENDPOINT_AUTH_CALLBACK_GOOGLE: z
    .string()
    .regex(/google-callback/)
    .default("/api/auth/google-callback")
    .describe("Google OAuth Callback URL"),
  GOOGLE_CLIENT_ID: z.string().describe("Google OAuth Client ID"),
  GOOGLE_CLIENT_SECRET: z.string().describe("Google OAuth Client Secret"),
}).superRefine((input, ctx) => {
  if (input.RUNTIME_ENV === "prod") {
    // deno-lint-ignore no-inner-declarations
    function prod_required(envVar: keyof typeof input) {
      if (!input[envVar]) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_type,
          expected: "string",
          received: "undefined",
          path: [envVar],
          message: `Must be set when RUNTIME_ENV is '${input.RUNTIME_ENV}'`,
        });
      }
    }

    ([
      "UI_URL",
    ] as (keyof typeof input)[]).forEach(prod_required);
  }
});

export type Env = z.infer<typeof EnvSchema>;
export const Env = await EnvSchema.parseAsync(Deno.env.toObject());
