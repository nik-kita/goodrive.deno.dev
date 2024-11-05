import { defineRoute } from "$fresh/src/server/defines.ts";
import { Env } from "../common/env.ts";
import { GoogleDriveItemCard } from "../islands/GoogleDriveItemCard.tsx";
import { IndexState } from "../routes/_middleware.ts";

export const HomePage = defineRoute<IndexState>((_req, {
  state: {
    session,
  },
}) => {
  console.log(session);
  const user_g_drive_authorization =
    session?.user?.google_drive_authorization || {};

  const user_storages = Object.entries(
    user_g_drive_authorization,
  ).map(([email, tokens]) => {
    const is_google_drive_authorized =
      !!(tokens?.access_token && tokens.refresh_token);
    return (
      <GoogleDriveItemCard
        {...{ is_google_drive_authorized, email, key: email }}
      />
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
    </div>
  );
});
