import { defineRoute } from "$fresh/src/server/defines.ts";
import { DemoFooter } from "./Footer.tsx";
import { DemoHeader } from "./Header.tsx";

export const DemoPage = defineRoute(async (req, _res) => {
  const jRes = new URLSearchParams(req.url).get("jRes");
  return (
    <div>
      <DemoHeader />
      <fieldset>
        <legend>Check your api-key</legend>
        <form
          method="post"
          action="/api/dev/upload-file"
          enctype="multipart/form-data"
        >
          <label for="api-key">Api Key</label>
          <input
            id="api-key"
            type="text"
            name="api-key"
            placeholder={"your api-key"}
            required
          />
          <label for="file-name">File Name</label>
          <input
            id="file-name"
            type="text"
            name="name"
            placeholder={"name for your file (optional, will override default)"}
          />
          <label for="file-mime-type">Mime Type</label>
          <input
            id="file-mime-type"
            type="text"
            name="mimeType"
            placeholder={"mimeType for your file (optional, will override default)"}
          />
          <label for="file">File</label>
          <input id="file" type="file" name="file" />
          <input type="submit" />
        </form>
      </fieldset>
      <DemoFooter res={jRes || undefined} />
    </div>
  );
});
