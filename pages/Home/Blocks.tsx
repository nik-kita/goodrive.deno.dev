import { Env } from "@/common/env.ts";
import { Button } from "@/components/ui/Button.tsx";
import type { ApiKey } from "../../core/models/ApiKey.ts";
import { ClipBoard } from "../../islands/ClipBoard.tsx";
import { H4, P, Ul } from "@/components/ui/Typography.tsx";

export const deps = {
  Button_connect_new_g_drive,
  Menu_for_email_enabled_google_drive,
  Menu_for_email_with_unauthorized_g_drive,
  Menu_for_email_with_authorized_but_not_enabled_g_drive,
};

function Button_connect_new_g_drive() {
  return (
    <a href={Env.API_ENDPOINT_AUTH_AUTHORIZATION_G_DRIVE}>
      <Button>
        Connect New or Switch to Another
      </Button>
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
          <Ul>
            <H4>
              {info.name.split("::").shift()}
            </H4>
            {info.description && (
              <P>
                {info.description}
              </P>
            )}
            <pre id="">
            {info.api_key.substring(0, 4) +
              "*".repeat(info.api_key.length - 4)}
            </pre>
            <ClipBoard text_container_id="api-key-to-copy">
              <P id="api-key-to-copy" style={{ display: "none" }}>
                {info.api_key}
              </P>
            </ClipBoard>
          </Ul>
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
          <Button>
            Authorize Google Drive
          </Button>
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
    <Ul>
      <li>
        <details>
          <summary>
            Enable API
          </summary>
          <P>
            generate access and refresh tokens pair
          </P>
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
        <Button>Revoke Google Drive authorization</Button>
      </li>
    </Ul>
  );
}
