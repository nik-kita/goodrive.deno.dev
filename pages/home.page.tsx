import { defineRoute } from "$fresh/src/server/defines.ts";
import { Env } from "../common/env.ts";
import { IndexState } from "../routes/_middleware.ts";

export const HomePage = defineRoute<IndexState>(async (_req, {
  state: {
    session,
  },
}) => {
  const data = await Array.fromAsync(
    await Deno.openKv().then((kv) => kv.list({ prefix: [] })),
  );
  const dbData = Object.fromEntries(data.map((v) => {
    return [v.key.join("/"), v.value];
  }));

  const user_storages = Object.entries(
    session?.user?.google_drive_authorization || {},
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
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </details>
      <details open>
        <summary>kv</summary>
        <pre>{JSON.stringify(dbData, null, 2)}</pre>
      </details>
    </div>
  );
});
