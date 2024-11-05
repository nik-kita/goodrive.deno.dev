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
    ({ email, accesses, refresh, sub, access_token, refresh_token }) => {
      const is_g_drive_authorized = access_token && refresh_token;
      const is_google_drive_enabled = is_g_drive_authorized && refresh &&
        accesses?.length;
      let Menu: JSX.Element;

      if (is_google_drive_enabled) {
        Menu = (
          <deps.Menu_for_email_enabled_google_drive
            accesses={accesses}
            refresh={refresh}
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
