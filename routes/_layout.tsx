import { defineLayout } from "$fresh/src/server/defines.ts";
import { Env } from "../common/env.ts";
import { IndexState } from "./_middleware.ts";

export default defineLayout<IndexState>(
  (_req, { state: { session }, Component }) => {
    return (
      <div>
        {!session?.user && (
          <a href={Env.API_ENDPOINT_AUTH_GOOGLE_SIGNIN}>
            Sign In with Google
          </a>
        )}
        <Component />
        {!session?.user || (
          <a href={Env.API_ENDPOINT_AUTH_GOOGLE_SIGNOUT}>Sign Out</a>
        )}
      </div>
    );
  },
);
