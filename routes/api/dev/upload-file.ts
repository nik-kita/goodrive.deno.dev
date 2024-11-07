import type { Handlers } from "$fresh/server.ts";
import { OAuth2Client } from "google-auth-library";
import { Readable } from "node:stream";
import { drive_v3 } from "npm:@googleapis/drive";
import { Env } from "../../../common/env.ts";
import { db } from "../../../common/kv.ts";
import type { ApiState } from "../../api/_middleware.ts";

const client = new OAuth2Client({
  clientSecret: Env.GOOGLE_CLIENT_SECRET,
  clientId: Env.GOOGLE_CLIENT_ID,
  redirectUri: Env.API_ENDPOINT_AUTH_CALLBACK_GOOGLE,
});

export const handler: Handlers<unknown, ApiState> = {
  POST: async (req, ctx) => {
    const formData = await req.formData();
    const file = formData.get("file");
    const name = formData.get("name");
    const mimeType = formData.get("mimeType");
    const apiKey = formData.get("api-key");

    if (!apiKey || typeof apiKey !== "string") {
      return new Response("Missing api-key", { status: 400 });
    } else if (!(file instanceof File)) {
      return new Response("Missing file", { status: 400 });
    } else if (
      (name && typeof name !== "string") ||
      (mimeType && typeof mimeType !== "string")
    ) {
      return new Response("Invalid name or mimeType", { status: 400 });
    }

    const api_key = await db.api_key.findByPrimaryIndex("api_key", apiKey).then(
      (r) => r?.value,
    );

    if (!api_key) {
      return new Response("Invalid api-key", { status: 400 });
    }

    const user = await db.user.findByPrimaryIndex("sub", api_key.sub).then((
      r,
    ) => r?.value);

    if (!user) {
      return new Response("User not found", { status: 500 });
    }

    const { refresh_token } = user
      .google_drive_authorization[api_key.email] || {};

    if (!refresh_token) {
      return new Response("User not authorized", { status: 401 });
    }

    client.setCredentials({
      refresh_token,
    });

    const payload = {
      requestBody: {
        name: name || file.name,
        mimeType: mimeType || file.type,
      },
      media: {
        body: Readable.from(file.stream()),
      },
    };

    const res = await new drive_v3.Drive({ auth: client })
      .files
      .create(payload);

    return new Response(null, {
      status: 303,
      headers: {
        location: ctx.state.origin + `/demo?jRes=${JSON.stringify(res.data)}`,
      },
    });
  },
};
