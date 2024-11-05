type Props = {
  email: string;
  is_google_drive_authorized: boolean;
};

export function GoogleDriveItemCard(props: Props) {
  const {
    email,
    is_google_drive_authorized,
  } = props;
  const onClick_Activate = async () => {
    const res = await fetch("/api/auth/refresh", {
      method: "PUT",
    }).then((r) => r.json());

    console.log(res);
  };

  return (
    <div>
      <h2>{email}</h2>
      <button onClick={onClick_Activate}>Activate</button>
    </div>
  );
}
