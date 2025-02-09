import type { createHelpers } from "@deno/kv-oauth";
import { type Tokens as Tokens_deno_land_x_oauth2_client } from "@denoland/oauth2_client";

export type Tokens = Tokens_deno_land_x_oauth2_client;
type _handleCallback = ReturnType<
  typeof createHelpers
>["handleCallback"];

export type HandleCallbackType = (
  ...params: Parameters<_handleCallback>
) => Omit<ReturnType<_handleCallback>, "tokens"> & {
  tokens: Tokens;
};
