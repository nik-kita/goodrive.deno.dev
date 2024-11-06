import { z } from "zod";

const _RefreshToken = z.object({
  api_refresh: z.string(),
  email: z.string().email(),
  sub: z.string(),
  expiration_time: z.number().positive(),
  /**
   * @description
   * to provide unique for search but save user's value
   * should be in format contain sub and Date.now() with actual name
   * splitted by "____"
   */
  name: z.string().regex(/\S+____\S+____\S+/),
  description: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});
export const RefreshToken = _RefreshToken as
  & typeof _RefreshToken
  & typeof WithHelperStuff;

export type RefreshToken =
  & z.infer<
    typeof _RefreshToken
  >
  & WithHelperStuff;

RefreshToken.generate_name = ({ sub, name }) =>
  `${name || "no-name"}____${Date.now()}____${sub}`;

abstract class WithHelperStuff {
  static generate_name: (payload: { sub: string; name?: string }) => string;
}
