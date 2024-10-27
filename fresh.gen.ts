// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $api_clean_kv from "./routes/api/clean-kv.ts";
import * as $index from "./routes/index.tsx";
import * as $clean_kv_button from "./islands/clean-kv-button.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/api/clean-kv.ts": $api_clean_kv,
    "./routes/index.tsx": $index,
  },
  islands: {
    "./islands/clean-kv-button.tsx": $clean_kv_button,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
