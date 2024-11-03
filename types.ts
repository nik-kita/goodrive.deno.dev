import type { createHelpers } from "@deno/kv-oauth";
import { type Tokens as Tokens_deno_land_x_oauth2_client } from "https://deno.land/x/oauth2_client@v1.0.2/mod.ts";

export type Tokens = Tokens_deno_land_x_oauth2_client;
type _handleCallback = ReturnType<
  typeof createHelpers
>["handleCallback"];

export type HandleCallbackType = (
  ...params: Parameters<_handleCallback>
) => Omit<ReturnType<_handleCallback>, "tokens"> & {
  tokens: Tokens;
};
