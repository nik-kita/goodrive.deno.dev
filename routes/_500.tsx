import { Head } from "$fresh/runtime.ts";

export default function Error500() {
  return (
    <>
      <Head>
        <title>500 - Internal Server Error</title>
      </Head>
      <div class="px-4 py-8 mx-auto bg-[#86efac]">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <img
            class="my-6"
            src="/logo.svg"
            width="128"
            height="128"
            alt="the Fresh logo: a sliced lemon dripping with juice"
          />
          <h1 class="text-4xl font-bold">500 - Woops!</h1>
          <p class="my-4">
            Something went wrong on our end....
          </p>
          <a href="/" class="underline">Go back home</a>
        </div>
      </div>
    </>
  );
}
