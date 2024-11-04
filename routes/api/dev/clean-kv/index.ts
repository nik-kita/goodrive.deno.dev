import type { Handlers } from "$fresh/server.ts";
import { kv } from "../../../../common/kv.ts";
import { AppState } from "../../../_middleware.ts";

export const handler: Handlers<unknown, AppState> = {
  DELETE: async () => {
    await drop_db();

    return new Response(null, { status: 204 });
  },
  POST: async (_, ctx) => {
    await drop_db();

    return new Response(null, {
      status: 303,
      headers: {
        Location: ctx.state.origin,
      },
    });
  },
};

async function drop_db() {
  console.log(await kv.tree());
  for await (const entry of kv.list({ prefix: [] })) {
    await kv.delete(entry.key);
    console.log(`Deleted key: ${entry.key}`);
  }
  console.log("All data deleted from Deno KV.");
}
