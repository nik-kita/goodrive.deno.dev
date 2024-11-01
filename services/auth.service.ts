import { CryptoKeyUtil } from "../utils/crypto_key_util.ts";

export const AuthService = {
  generate_token_pairs,
};

const issuer = "demo.only";

async function generate_token_pairs(sub: string) {
  const [access_token, refresh_token] = await Promise.all([
    CryptoKeyUtil.sign_jwt({
      issuer,
      user_id: sub,
      expiresIn: new Date(Date.now() + 1000 * 60 * 15),
      privateKeyPem: "ACCESS_TOKEN_PRIVATE_KEY",
    }),
    CryptoKeyUtil.sign_jwt({
      issuer,
      user_id: sub,
      expiresIn: new Date(Date.now() + 1000 * 60 * 60 * 24),
      privateKeyPem: "REFRESH_TOKEN_PRIVATE_KEY",
    }),
  ]);

  return { access_token, refresh_token };
}
