import { H4 } from "@/components/ui/Typography.tsx";

export const DemoFooter = (props: { res?: string }) => {
  return (
    <>
      {props.res && (
        <>
          <H4>Response:</H4>
          <pre>{props.res}</pre>
        </>
      )}
    </>
  );
};
