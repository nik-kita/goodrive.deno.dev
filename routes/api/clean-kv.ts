import type { Handlers } from "$fresh/server.ts";
import { kv } from "../../kv.ts";

export const handler: Handlers = {
  DELETE: async function () {
    console.log(await kv.tree());
    for await (const entry of kv.list({ prefix: [] })) {
      await kv.delete(entry.key);
      console.log(`Deleted key: ${entry.key}`);
    }
    console.log("All data deleted from Deno KV.");

    return new Response("done");
  },
};
