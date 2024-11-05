import { defineRoute } from "$fresh/src/server/defines.ts";
import { JSX } from "preact";
import { Env } from "../common/env.ts";
import { db } from "../common/kv.ts";
import { IndexState } from "../routes/_middleware.ts";

export const HomePage = defineRoute<IndexState>(async (_req, {
  state: {
    session,
  },
}) => {
  console.log(session, "session");
  const apiKeyPairsByEmail = session?.user
    ? (await db.api_token_pair.findBySecondaryIndex("sub", session.user.sub))
      .result.map((r) => r.flat())
    : [];
  console.log(apiKeyPairsByEmail, "apiKeyPairsByEmail");
  const apiKeyPairs = apiKeyPairsByEmail as Partial<
    typeof apiKeyPairsByEmail[number] & {
      is_g_drive_authorized?: boolean;
    }
  >[];
  if (session?.user?.google_drive_authorization) {
    for (
      const pair of apiKeyPairs
    ) {
      const emailGdriveAuthorization =
        session.user.google_drive_authorization[pair.email!];
      const is_g_drive_authorized = !!(emailGdriveAuthorization?.access_token &&
        emailGdriveAuthorization.refresh_token);
      console.log(is_g_drive_authorized);
      pair.is_g_drive_authorized = is_g_drive_authorized;
      if (!is_g_drive_authorized) {
        void db.api_token_pair.deleteByPrimaryIndex("email", pair.email!)
          .catch(console.error);
        delete pair.access_tokens;
        delete pair.refresh_token;
      } else if (!pair.refresh_token && pair.access_tokens?.length) {
        pair.access_tokens = [];
        void db.api_token_pair.updateByPrimaryIndex("email", pair.email!, {
          access_tokens: [],
        }, { strategy: "merge", mergeOptions: { arrays: "replace" } });
      }
      delete session.user.google_drive_authorization[pair.email!];
    }

    const rest = Object.entries(session.user.google_drive_authorization);

    if (rest.length) {
      for (const [email, v] of rest) {
        apiKeyPairs.push({
          email,
          sub: session.user.sub,
          is_g_drive_authorized: !!(v?.access_token && v?.refresh_token),
        });
      }
    }
  } else if (apiKeyPairsByEmail.length) {
    void (async () => {
      for (const email of apiKeyPairsByEmail) {
        await db.api_token_pair.deleteByPrimaryIndex("email", email.email);
      }
    })().catch(console.error);
  }

  const user_storages = apiKeyPairs.map(
    ({ email, is_g_drive_authorized, access_tokens, refresh_token, sub }) => {
      const is_google_drive_enabled = is_g_drive_authorized && access_tokens &&
        refresh_token;
      let Menu: JSX.Element;

      if (is_google_drive_enabled) {
        Menu = (
          <ul>
            <li>
              <details>
                <summary>Access token</summary>
                <pre>{access_tokens[0]}</pre>
              </details>
              <details>
                <summary>Refresh token</summary>
                <pre>{refresh_token}</pre>
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
        console.log({ email, sub });
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
