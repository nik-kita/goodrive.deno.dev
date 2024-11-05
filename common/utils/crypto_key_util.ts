import {
  create,
  decode,
  getNumericDate,
  type Header,
  type Payload,
  verify,
} from "@wok/djwt";
import { Env } from "../env.ts";

export class CryptoKeyUtil {
  public static convert_to_crypto_key({
    pemKey,
    type,
  }: {
    pemKey: string;
    type: "PUBLIC" | "PRIVATE";
  }): Promise<CryptoKey> | undefined {
    if (type === "PRIVATE") {
      return crypto.subtle.importKey(
        "pkcs8",
        CryptoKeyUtil.pem_to_arr_buff(pemKey, type),
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: {
            name: "SHA-256",
          },
        },
        false,
        ["sign"],
      );
    } else if (type === "PUBLIC") {
      return crypto.subtle.importKey(
        "spki",
        CryptoKeyUtil.pem_to_arr_buff(pemKey, type),
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: {
            name: "SHA-256",
          },
        },
        false,
        ["verify"],
      );
    }
  }

  public static async sign_jwt({
    user_id,
    issuer,
    privateKeyPem,
    expiresIn,
  }: {
    user_id: string;
    issuer: string;
    privateKeyPem: "ACCESS_TOKEN_PRIVATE_KEY" | "REFRESH_TOKEN_PRIVATE_KEY";
    expiresIn: Date;
  }): Promise<{ token: string }> {
    const header: Header = {
      alg: "RS256",
      typ: "JWT",
    };

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const tokenExpiresIn = getNumericDate(expiresIn);

    const payload: Payload = {
      iss: issuer,
      iat: nowInSeconds,
      exp: tokenExpiresIn,
      sub: user_id,
    };

    const cryptoPrivateKey = await CryptoKeyUtil.convert_to_crypto_key({
      pemKey: atob(Env[privateKeyPem]),
      type: "PRIVATE",
    });

    const token = await create(header, payload, cryptoPrivateKey!);

    return { token };
  }

  public static async verify_jwt<T extends Payload>({
    token,
    publicKeyPem,
  }: {
    token: string;
    publicKeyPem: "ACCESS_TOKEN_PUBLIC_KEY" | "REFRESH_TOKEN_PUBLIC_KEY";
  }): Promise<T | null> {
    try {
      const cryptoPublicKey = await CryptoKeyUtil.convert_to_crypto_key({
        pemKey: atob(Env[publicKeyPem]),
        type: "PUBLIC",
      });

      return (await verify(token, cryptoPublicKey!)) as T;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  public static decode_jwt<T extends object>(
    token: string,
  ): {
    header: unknown;
    payload: T;
    signature: Uint8Array;
  } {
    const [header, payload, signature] = decode(token);

    return {
      header,
      payload: payload as T,
      signature,
    };
  }

  private static rm_lines(str: string): string {
    return str.replace("\n", "");
  }

  private static base64_to_arr_buff(b64: string): Uint8Array {
    const byteString = atob(b64);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    return byteArray;
  }

  private static pem_to_arr_buff(
    pemKey: string,
    type: "PUBLIC" | "PRIVATE",
  ): Uint8Array {
    const b64Lines = CryptoKeyUtil.rm_lines(pemKey);
    const b64Prefix = b64Lines.replace(`-----BEGIN ${type} KEY-----`, "");
    const b64Final = b64Prefix.replace(`-----END ${type} KEY-----`, "");

    return CryptoKeyUtil.base64_to_arr_buff(b64Final);
  }
}
