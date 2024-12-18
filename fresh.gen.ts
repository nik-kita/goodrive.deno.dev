// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_500 from "./routes/_500.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_layout from "./routes/_layout.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $api_middleware from "./routes/api/_middleware.ts";
import * as $api_auth_login from "./routes/api/auth/login.ts";
import * as $api_dev_clean_kv from "./routes/api/dev/clean-kv.ts";
import * as $api_dev_upload_file from "./routes/api/dev/upload-file.ts";
import * as $demo_index from "./routes/demo/index.tsx";
import * as $index from "./routes/index.tsx";
import * as $ClipBoard from "./islands/ClipBoard.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_500.tsx": $_500,
    "./routes/_app.tsx": $_app,
    "./routes/_layout.tsx": $_layout,
    "./routes/_middleware.ts": $_middleware,
    "./routes/api/_middleware.ts": $api_middleware,
    "./routes/api/auth/login.ts": $api_auth_login,
    "./routes/api/dev/clean-kv.ts": $api_dev_clean_kv,
    "./routes/api/dev/upload-file.ts": $api_dev_upload_file,
    "./routes/demo/index.tsx": $demo_index,
    "./routes/index.tsx": $index,
  },
  islands: {
    "./islands/ClipBoard.tsx": $ClipBoard,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
