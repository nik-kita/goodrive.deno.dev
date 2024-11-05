import { Handlers } from "$fresh/server.ts";
import { AuthService } from "../../../common/auth.service.ts";
import { db } from "../../../common/kv.ts";
import { ApiState } from "../_middleware.ts";

export const handler: Handlers<unknown, ApiState> = {
  POST: async (req, ctx) => {
    console.log("login");
    const data = await req.text();
    const body = new URLSearchParams(data);
    const payload = {
      email: body.get("email")!,
      sub: body.get("sub")!,
      session_id: body.get("session_id")!,
    };
    console.log(payload, "payload");
    await void handle_login(payload);

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
}) {
  const {
    email,
    sub,
    session_id,
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
  const token_pair = await AuthService.generate_token_pairs(sub);
  const newApiTokenPair = {
    access_tokens: [token_pair.access_token],
    refresh_token: token_pair.refresh_token,
    email,
    sub,
  };
  await db.api_token_pair.upsertByPrimaryIndex({
    index: ["email", email],
    set: newApiTokenPair,
    update: {
      access_tokens: newApiTokenPair.access_tokens,
    },
  }, { strategy: "merge", mergeOptions: { arrays: "merge" } });

  console.log(token_pair, "token_pair");

  return token_pair;
}
