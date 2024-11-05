import type { Handlers } from "$fresh/server.ts";
import { AuthService } from "../../../common/auth.service.ts";

export const handler: Handlers = {
  PUT: async (req) => {
    const body = await req.json();

    if (!body.refresh_token) {
      return new Response("Bad Request", { status: 400 });
    }

    const token_pair = await AuthService.generate_token_pairs("test");

    return new Response(
      JSON.stringify(token_pair),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  },
};
