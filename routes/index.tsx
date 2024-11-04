import { type RouteContext } from "$fresh/server.ts";
import { Env } from "../common/env.ts";
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

  const user_storages = Object.entries(
    sessionData?.user?.google_drive_authorization || {},
  ).map(([email, tokens]) => {
    return (
      <details>
        <summary>{email}</summary>
        <input
          {...{
            type: "checkbox",
            disabled: true,
            checked: !!(tokens?.access_token && tokens.refresh_token),
          }}
        />
      </details>
    );
  });

  return (
    <div>
      <h1>Welcome!</h1>
      <fieldset>
        <legend>Auth</legend>
        <ul>
          <li>
            <a href={Env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN}>
              Sign In with Google
            </a>
          </li>
          <li>
            <a href={Env.API_ENDPOINT_AUTH_GOOGLE_SIGNOUT}>Sign Out</a>
          </li>
        </ul>
      </fieldset>
      <fieldset>
        <legend>App</legend>
        <ul>
          {user_storages}
        </ul>
        <a href={Env.API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE}>
          <button>
            Add New Tiny Storage
          </button>
        </a>
      </fieldset>
      <hr />
      <form action="/api/dev/clean-kv" method="POST">
        <input type="submit" value={"drop database"} />
      </form>
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
