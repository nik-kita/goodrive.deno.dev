export const DemoFooter = (props: { res?: string }) => {
  return (
    <>
      {props.res && (
        <>
          <h4>Response:</h4>
          <pre>{props.res}</pre>
        </>
      )}
    </>
  );
};
