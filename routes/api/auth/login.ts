import { Handlers } from "$fresh/server.ts";
import { db } from "../../../common/kv.ts";
import { ApiState } from "../_middleware.ts";

export const handler: Handlers<unknown, ApiState> = {
  POST: async (req, ctx) => {
    const data = await req.text();
    const body = new URLSearchParams(data);
    const payload = {
      email: body.get("email")!,
      sub: body.get("sub")!,
      session_id: body.get("session_id")!,
    };
    void await handle_login(payload);

    return new Response(null, {
      status: 302,
      headers: {
        location: ctx.state.origin,
      },
    });
  },
};

async function handle_login(options: {
  email: string;
  sub: string;
  session_id: string;
  name?: string;
  description?: string;
  expires_after?: number;
}) {
  const {
    email,
    sub,
    session_id,
    expires_after,
    description,
    name,
  } = options;
  const session = await db.app_session.findByPrimaryIndex(
    "session",
    session_id,
  ).then((r) => r?.value);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const user = await db.user.findByPrimaryIndex("sub", session.sub).then((r) =>
    r?.value
  );
  if (!user) {
    throw new Error("User not found");
  }
  if (!user.google_drive_authorization[email]) {
    return new Response("Forbidden", { status: 403 });
  }
  const now = new Date();
  const generated_name = `${
    name?.replaceAll(":", "-") || "key-" + Date.now()
  }::${sub}`;
  const api_key = crypto.randomUUID();
  void db.api_key.add({
    api_key,
    email,
    sub,
    expiration_time: expires_after
      ? new Date(Date.now() + expires_after).getTime()
      : undefined,
    description,
    name: generated_name,
    created_at: now,
    updated_at: now,
  });

  return api_key;
}
