import { defineRoute } from "$fresh/src/server/defines.ts";
import { JSX } from "preact";
import { Env } from "../../common/env.ts";
import { IndexState } from "../../routes/_middleware.ts";
import { parse_user_data } from "./parse-user-data.ts";

export const HomePage = defineRoute<IndexState>(async (_req, {
  state: {
    session,
  },
}) => {
  const data = session?.user ? await parse_user_data(session.user) : [];

  const user_storages = data.map(
    ({ email, accesses, refresh, sub, access_token, refresh_token }) => {
      const is_g_drive_authorized = access_token && refresh_token;
      const is_google_drive_enabled = is_g_drive_authorized && refresh &&
        accesses?.length;
      let Menu: JSX.Element;

      if (is_google_drive_enabled) {
        Menu = (
          <ul>
            <li>
              <details>
                <summary>Access token</summary>
                <pre>{accesses[0]}</pre>
              </details>
              <details>
                <summary>Refresh token</summary>
                <pre>{refresh}</pre>
              </details>
            </li>
            <li>
              <button>
                Issue extra access token
              </button>
            </li>
            <li>
              <button>Revoke tokens</button>
            </li>
          </ul>
        );
      } else if (is_g_drive_authorized) {
        Menu = (
          <ul>
            <li>
              <details>
                <summary>
                  Enable API
                </summary>
                <p>
                  generate access and refresh tokens pair
                </p>
                <form method="post" action="/api/auth/login">
                  <input type="hidden" name="email" value={email!} />
                  <input type="hidden" name="sub" value={sub!} />
                  <input
                    type="hidden"
                    name="session_id"
                    value={session!.session_id}
                  />
                  <input type="submit" />
                </form>
              </details>
            </li>
            <li>
              <button>Revoke Google Drive authorization</button>
            </li>
          </ul>
        );
      } else {
        Menu = (
          <ul>
            <li>
              <a href={Env.API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE}>
                <button>
                  Authorize Google Drive
                </button>
              </a>
            </li>
          </ul>
        );
      }

      return (
        <li>
          <h2>{email}</h2>
          {Menu}
        </li>
      );
    },
  );

  return (
    <div>
      {!!session?.user || (
        <a href={Env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN}>
          Sign In with Google
        </a>
      )}
      <fieldset>
        <legend>
          <h1>Welcome!</h1>
        </legend>
        <ul>
          {user_storages}
        </ul>
        <a href={Env.API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE}>
          <button>
            Add New Tiny Storage
          </button>
        </a>
      </fieldset>
      {!!session?.user && (
        <a href={Env.API_ENDPOINT_AUTH_GOOGLE_SIGNOUT}>Sign Out</a>
      )}
    </div>
  );
});
