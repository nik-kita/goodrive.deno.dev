import { Env } from "../../common/env.ts";
import type { ApiKey } from "../../core/models/ApiKey.ts";
import { ClipBoard } from "../../islands/ClipBoard.tsx";

export const deps = {
  Button_connect_new_g_drive,
  Menu_for_email_enabled_google_drive,
  Menu_for_email_with_unauthorized_g_drive,
  Menu_for_email_with_authorized_but_not_enabled_g_drive,
};

function Button_connect_new_g_drive() {
  return (
    <a href={Env.API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE}>
      <button>
        Connect New or Switch to Another
      </button>
    </a>
  );
}

function Menu_for_email_enabled_google_drive(props: {
  api_info: ApiKey[];
}) {
  return (
    <ol>
      {props.api_info.map((info) => {
        return (
          <li>
            <h4>
              {info.name}
            </h4>
            {info.description && (
              <p>
                {info.description}
              </p>
            )}
            <details>
              <summary>
                {info.api_key.substring(0, 4) +
                  "*".repeat(info.api_key.length - 4)}
              </summary>
              <ClipBoard text_container_id="api-key-to-copy">
                <p id="api-key-to-copy" style={{ display: "none" }}>
                  {info.api_key}
                </p>
              </ClipBoard>
            </details>
          </li>
        );
      })}
    </ol>
  );
}

function Menu_for_email_with_unauthorized_g_drive() {
  return (
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

function Menu_for_email_with_authorized_but_not_enabled_g_drive(
  {
    email,
    sub,
    session_id,
  }: { email: string; sub: string; session_id: string },
) {
  return (
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
              value={session_id}
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
}
