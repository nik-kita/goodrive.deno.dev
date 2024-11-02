import { type RouteContext } from "$fresh/server.ts";
import { env } from "../env.ts";
import { CleanKvButton } from "../islands/clean-kv-button.tsx";
import { getSessionId } from "../plugins/kv_oauth/google/helpers_google.ts";

export default async function (_req: Request, _ctx: RouteContext) {
  const session = await getSessionId(_req);
  const data = await Array.fromAsync(
    await Deno.openKv().then((kv) => kv.list({ prefix: [] })),
  );

  return (
    <div>
      <h1>Welcome!</h1>
      <fieldset>
        <legend>Auth</legend>
        <ul>
          <li>
            <a href={env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN}>
              Sign In with Google
            </a>
          </li>
          <li>
            <a href={env.API_ENDPOINT_AUTH_GOOGLE_SIGNOUT}>Sign Out</a>
          </li>
        </ul>
      </fieldset>
      <hr />
      <CleanKvButton />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
