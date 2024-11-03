import { type RouteContext } from "$fresh/server.ts";
import { env } from "../env.ts";
import { CleanKvButton } from "../islands/clean-kv-button.tsx";
import { google_authentication_sign_out_handler } from "../plugins/kv_oauth/google/authentication/sign-out.ts";
import { get_session } from "../plugins/kv_oauth/google/get-session.ts";

export default async function (req: Request, _ctx: RouteContext) {
  const sessionData = await get_session(req);

  if (sessionData?.session_id && !sessionData?.user) {
    return await google_authentication_sign_out_handler(req);
  }

  const data = await Array.fromAsync(
    await Deno.openKv().then((kv) => kv.list({ prefix: [] })),
  );
  const dbData = Object.fromEntries(data.map((v) => {
    return [v.key.join("/"), v.value];
  }));

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
      <details open>
        <summary>session</summary>
        <pre>{JSON.stringify(sessionData, null, 2)}</pre>
      </details>
      <details open>
        <summary>kv</summary>
        <pre>{JSON.stringify(dbData, null, 2)}</pre>
      </details>
    </div>
  );
}
