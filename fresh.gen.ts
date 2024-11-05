// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_500 from "./routes/_500.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $api_middleware from "./routes/api/_middleware.ts";
import * as $api_auth_login from "./routes/api/auth/login.ts";
import * as $api_auth_refresh from "./routes/api/auth/refresh.ts";
import * as $api_dev_clean_kv from "./routes/api/dev/clean-kv.ts";
import * as $index from "./routes/index.tsx";

import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_500.tsx": $_500,
    "./routes/_app.tsx": $_app,
    "./routes/_middleware.ts": $_middleware,
    "./routes/api/_middleware.ts": $api_middleware,
    "./routes/api/auth/login.ts": $api_auth_login,
    "./routes/api/auth/refresh.ts": $api_auth_refresh,
    "./routes/api/dev/clean-kv.ts": $api_dev_clean_kv,
    "./routes/index.tsx": $index,
  },
  islands: {},
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
