const arrayBufferToBase64 = (
  arrayBuffer: ArrayBuffer,
): string => {
  const byteArray = new Uint8Array(
    arrayBuffer,
  );
  let byteString = "";
  byteArray.forEach(
    (byte) => {
      byteString += String
        .fromCharCode(
          byte,
        );
    },
  );
  return btoa(
    byteString,
  );
};

const breakPemIntoMultipleLines = (
  pem: string,
): string => {
  const charsPerLine = 64;
  let pemContents = "";
  while (
    pem.length > 0
  ) {
    pemContents += `${
      pem
        .substring(
          0,
          charsPerLine,
        )
    }\n`;
    pem = pem
      .substring(64);
  }
  return pemContents;
};

const toPem = (
  key: ArrayBuffer,
  type:
    | "private"
    | "public",
): string => {
  const pemContents = breakPemIntoMultipleLines(
    arrayBufferToBase64(
      key,
    ),
  );
  return `-----BEGIN ${type.toUpperCase()} KEY-----\n${pemContents}-----END ${type.toUpperCase()} KEY-----`;
};

export async function generate_private_public_keys_pair() {
  const generatedKeyPair: CryptoKeyPair = await crypto
    .subtle
    .generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 4096,
        publicExponent: new Uint8Array(
          [
            1,
            0,
            1,
          ],
        ),
        hash: "SHA-256",
      },
      true,
      [
        "sign",
        "verify",
      ],
    );
  const privateKeyBuffer: ArrayBuffer = await crypto
    .subtle
    .exportKey(
      "pkcs8",
      generatedKeyPair
        .privateKey,
    );

  const exportedPublicKey: ArrayBuffer = await crypto
    .subtle
    .exportKey(
      "spki",
      generatedKeyPair
        .publicKey,
    );
  const privateKeyPem = toPem(
    privateKeyBuffer,
    "private",
  );
  const publicKeyPem = toPem(
    exportedPublicKey,
    "public",
  );
  const PRIVATE_KEY = btoa(
    privateKeyPem,
  );
  const PUBLIC_KEY = btoa(
    publicKeyPem,
  );

  return {
    PRIVATE_KEY,
    PUBLIC_KEY,
  };
}

if (import.meta.main) {
  const access = await generate_private_public_keys_pair();

  console.warn(
    `\n${'ACCESS_TOKEN_PRIVATE_KEY="'}${access.PRIVATE_KEY}"`,
  );
  console.warn(
    `\n${'ACCESS_TOKEN_PUBLIC_KEY="'}${access.PUBLIC_KEY}"`,
  );
  const refresh = await generate_private_public_keys_pair();
  console.warn(
    `\n${'REFRESH_TOKEN_PRIVATE_KEY="'}${refresh.PRIVATE_KEY}"`,
  );
  console.warn(
    `\n${'REFRESH_TOKEN_PUBLIC_KEY="'}${refresh.PUBLIC_KEY}"`,
  );
}
