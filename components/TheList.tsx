import { JSX } from "preact";

type Props<T extends JSX.Element = JSX.Element> = {
  items: T[];
  getItemKey?: (item: T, i: number) => string;
  TheItem?: (props: { item: T }) => JSX.Element;
};

export function TheList(props: Props) {
  const {
    items,
    TheItem,
    getItemKey = (_, i) => i,
  } = props;
  return (
    <ul>
      {items.map((item, i) => {
        const key = getItemKey(item, i);

        return (
          <li key={key}>
            {TheItem ? <TheItem item={item} key={key} /> : item};
          </li>
        );
      })}
    </ul>
  );
}
