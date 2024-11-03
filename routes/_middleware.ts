import { FreshContext } from "$fresh/server.ts";
import { kv } from "../kv.ts";

export async function handler(
  _req: Request,
  ctx: FreshContext,
) {
  try {
    const resp = await ctx.next();
    return resp;
  } catch (err) {
    console.error(err);

    await kv.set(["error", Date.now()], err);

    return new Response(null, {
      headers: {
        location: "/500",
      },
      status: 302,
    });
  }
}
