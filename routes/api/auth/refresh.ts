import type { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  POST: async (req) => {
    try {
      const body = await req.json();

      if (!body.refresh_token) {
        return new Response("Bad Request", { status: 400 });
      }

      return new Response(JSON.stringify({
        access_token: "access-token",
        refresh_token: "refresh-token",
      }));
    } catch (err) {
      console.warn(err);
      return new Response("Internal server error", { status: 500 });
    }
  },
};
