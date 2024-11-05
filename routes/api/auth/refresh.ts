import type { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  PUT: async (req) => {
    const body = await req.json();

    if (!body.refresh_token) {
      return new Response("Bad Request", { status: 400 });
    }

    return new Response(JSON.stringify({
      access_token: "access-token",
      refresh_token: "refresh-token",
    }));
  },
};
