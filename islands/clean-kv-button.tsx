export function CleanKvButton() {
  return (
    <button
      onClick={async () => {
        console.log("click");
        const res = await fetch("/api/clean-kv", {
          method: "delete",
        });
        console.log(res);
      }}
    >
      clean kv
    </button>
  );
}
