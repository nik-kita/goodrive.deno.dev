import { type RouteContext } from "$fresh/server.ts";
import { env } from "../env.ts";
import { CleanKvButton } from "../islands/clean-kv-button.tsx";

export default async function (_req: Request, _ctx: RouteContext) {
  const data = await Array.fromAsync(
    await Deno.openKv().then((kv) => kv.list({ prefix: [] })),
  );

  return (
    <div>
      <h1>Welcome!</h1>
      <CleanKvButton />
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <a href={env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN}>Sign In with Google</a>
    </div>
  );
}
