import { Button } from "@/components/ui/Button.tsx";
import type { ComponentChildren } from "preact";

type Props = {
  text_container_id: string;
  children: ComponentChildren;
};

export function ClipBoard(props: Props) {
  const onClick = async () => {
    const text = document.getElementById(props.text_container_id)?.innerText ||
      "";
    await navigator.clipboard.writeText(text);
  };
  return (
    <>
      {props.children}
      <Button onClick={onClick}>copy</Button>
    </>
  );
}
