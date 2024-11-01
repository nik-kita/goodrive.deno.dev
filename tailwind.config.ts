import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx,js,jsx}",
  ],
  corePlugins: {
    preflight: false,
  },
} satisfies Config;
