import { H2, P } from "@/components/ui/Typography.tsx";

export const DemoHeader = () => {
  return (
    <>
      <a href="/">
        <H2>Go Home</H2>
      </a>
      <H2>Demo</H2>
      <P>
        <i>
          {"you should login with google and copy generated api-key (on Home page)"}
        </i>
      </P>
      <hr />
      <P>Here you can check your api-key</P>
      <P>
        All input is represent all ones that you should define in your request
        using form-data.
      </P>
    </>
  );
};
