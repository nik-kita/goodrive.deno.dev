import tailwind from "$fresh/plugins/tailwind.ts";
import { defineConfig } from "$fresh/server.ts";
import { env } from "./env.ts";

export default defineConfig({
  server: {
    port: env.API_PORT,
  },
  plugins: [tailwind()],
});
