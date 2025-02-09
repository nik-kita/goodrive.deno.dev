1. the exact version `npm:google-auth-library@8.0.0` is used because othervise
   the error about something like undefined in `GOOGLE_SDK_NODE_LOGGING` env
   variable happen
2. `@deno/kv-oauth` use `OAUTH_COOKIE_NAME` internally but in application level
   it is also used to delete cookies
