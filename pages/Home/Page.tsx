import { defineRoute } from "$fresh/src/server/defines.ts";
import { JSX } from "preact";
import { IndexState } from "../../routes/_middleware.ts";
import { deps } from "./Blocks.tsx";
import { HomeHeader } from "./Header.tsx";
import { parse_user_data } from "./parse-user-data.ts";

export const HomePage = defineRoute<IndexState>(async (_req, {
  state: {
    session,
  },
}) => {
  const data = session?.user ? await parse_user_data(session.user) : [];

  const user_storages = data.map(
    (
      {
        email,
        sub,
        access_token,
        refresh_token,
        api_info,
      },
    ) => {
      const is_g_drive_authorized = refresh_token && access_token;
      const is_google_drive_enabled = is_g_drive_authorized &&
        api_info?.some((info) => info.api_key);

      let Menu: JSX.Element;

      if (is_google_drive_enabled) {
        Menu = (
          <deps.Menu_for_email_enabled_google_drive
            api_info={api_info!}
          />
        );
      } else if (is_g_drive_authorized) {
        Menu = (
          <deps.Menu_for_email_with_authorized_but_not_enabled_g_drive
            {...{
              email: email!,
              sub: sub!,
              session_id: session!.session_id!,
            }}
          />
        );
      } else {
        Menu = <deps.Menu_for_email_with_unauthorized_g_drive />;
      }

      return (
        <li key={email}>
          <h4>{email}</h4>
          {Menu}
        </li>
      );
    },
  );

  return (
    <>
      <HomeHeader />
      <fieldset>
        <legend>Your Connected Google Drives</legend>
        <ul>
          {user_storages}
        </ul>
        <deps.Button_connect_new_g_drive />
      </fieldset>
    </>
  );
});
