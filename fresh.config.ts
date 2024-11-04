import tailwind from "$fresh/plugins/tailwind.ts";
import { defineConfig } from "$fresh/server.ts";
import { Env } from "./common/env.ts";
import { kv_oauth_plugin } from "./plugins/kv_oauth/mod.ts";

export default defineConfig({
  server: {
    port: Env.API_PORT,
  },
  plugins: [tailwind(), kv_oauth_plugin()],
});
