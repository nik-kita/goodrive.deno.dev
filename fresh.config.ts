import tailwind from "$fresh/plugins/tailwind.ts";
import { defineConfig } from "$fresh/server.ts";
import { env } from "./env.ts";
import kv_oauth from "./plugins/kv_oauth/mod_kv_oauth.ts";

export default defineConfig({
  server: {
    port: env.API_PORT,
  },
  plugins: [tailwind(), kv_oauth()],
});
