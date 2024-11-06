import { Handlers } from "$fresh/server.ts";
import { AuthService } from "../../../common/auth.service.ts";
import { db } from "../../../common/kv.ts";
import { RefreshToken } from "../../../core/models/RefreshToken.ts";
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
  refresh_expires_after?: number;
  access_expires_after?: number;
}) {
  const {
    email,
    sub,
    session_id,
    access_expires_after = 60 * 1000,
    refresh_expires_after = 60 * 60 * 24 * 30 * 1000,
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
  const token_pair = await AuthService.generate_token_pairs(sub, {
    access_expires_after,
    refresh_expires_after,
  });
  const now = new Date();
  const generated_name = RefreshToken.generate_name({ sub, name });

  void await Promise.all([
    db.refresh_token.add({
      api_refresh: token_pair.refresh_token,
      email,
      sub,
      expiration_time: refresh_expires_after,
      description,
      name: generated_name,
      created_at: now,
      updated_at: now,
    }),
    db.access_token.add({
      api_access: token_pair.access_token,
      by_api_refresh: token_pair.refresh_token,
      email,
      sub,
    }),
  ]);

  return token_pair;
}
