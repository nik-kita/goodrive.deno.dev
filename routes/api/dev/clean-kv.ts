import type { Handlers } from "$fresh/server.ts";
import { kv } from "../../../common/kv.ts";
import { ApiState } from "../_middleware.ts";

export const handler: Handlers<unknown, ApiState> = {
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
  for await (const entry of kv.list({ prefix: [] })) {
    await kv.delete(entry.key);
  }
}
