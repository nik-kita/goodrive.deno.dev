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
  API_HOST: z
    .string()
    .default("http://localhost"),
  UI_URL: z
    .string()
    .optional(),
  API_ENDPOINT_AUTH_GOOGLE_SIGNIN: z.string().default("/api/auth/google-email"),
  API_ENDPOINT_AUTH_GOOGLE_SIGNOUT: z.string().default(
    "/api/auth/google-signout",
  ),
  API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE: z.string().default(
    "/api/auth/google-drive",
  ),
  API_ENDPOINT_AUTH_CALLBACK_GOOGLE: z
    .string()
    .regex(/google-callback/)
    .default("/api/auth/google-callback"),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  AUTH_SESSION_MAX_SILENCE_DURATION_IN_SECONDS: z.number({ coerce: true })
    .positive().default(60),
}).transform((input) => {
  return {
    ...input,
    API_URL: input.API_HOST.match("http://localhost")
      ? `${input.API_HOST}:${input.API_PORT}`
      : input.API_HOST,
  };
}).superRefine((input, ctx) => {
  if (input.RUNTIME_ENV === "local") {
    input.UI_URL || (input.UI_URL = "http://localhost:5173");
  } else if (input.RUNTIME_ENV === "prod" || input.RUNTIME_ENV === "stage") {
    // deno-lint-ignore no-inner-declarations
    function in_runtime_required(envVar: keyof typeof input) {
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
    ] as (keyof typeof input)[]).forEach(in_runtime_required);
  }
});

export type Env = z.infer<typeof EnvSchema>;
export const Env = await EnvSchema.parseAsync(Deno.env.toObject());
