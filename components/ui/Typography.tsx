import { FunctionComponent } from "preact";

// deno-lint-ignore no-explicit-any
type Tag = FunctionComponent<any>; // TODO: type this properly

export const H1: Tag = (props) => {
  return (
    <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl" {...props}>
      {props.children}
    </h1>
  );
};

export const H2: Tag = (props) => {
  return (
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0" {...props}>
      {props.children}
    </h2>
  );
};

export const H3: Tag = (props) => {
  return (
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight" {...props}>
      {props.children}
    </h3>
  );
};

export const H4: Tag = (props) => {
  return (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight" {...props}>
      {props.children}
    </h4>
  );
};

export const P: Tag = (props) => {
  return (
    <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
      {props.children}
    </p>
  );
};

export const Blockquote: Tag = (props) => {
  return (
    <blockquote className="mt-6 border-l-2 pl-6 italic" {...props}>
      {props.children}
    </blockquote>
  );
};

export const Ul: Tag = (props) => {
  return (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
      {props.children}
    </ul>
  );
};
