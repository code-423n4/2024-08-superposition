// a formatted amount is a human-readable value, such as 1.445 or 20
// a token amount is a raw amount scaled by a token's decimals, such as 1445000 or 20000000

import { Position } from "@/hooks/usePostions";
import { output as seawaterContract } from "@/lib/abi/ISeawaterAMM";
import {
  getSqrtRatioAtTick,
  getTokenAmountsNumeric,
  sqrtPriceX96ToPrice,
} from "./math";
import { usdFormat } from "./usdFormat";
import { simulateContract } from "wagmi/actions";
import { config } from "@/config";
import { ammAddress } from "./addresses";
import { fUSDC, Token } from "@/config/tokens";

/**
 * @description convert a bigint formatted amount to a token amount
 * @param amount - formatted amount
 * @param decimals - number of token decimals
 * @returns raw token amount
 */
const getTokenAmountFromFormatted = (amount: bigint, decimals: number) =>
  amount * BigInt(10 ** decimals);

/**
 * @description format a number amount to at most the given decimals
 * without the unncessary padding from toFixed
 * @param amount - number amount
 * @param decimals: maximum number of decimals to display
 * @example 1.2, 6 -> 1.2
 * @example 1.23456789, 6 -> 1.234567
 * @example 1.0, 6 -> 1
 */
const snapAmountToDecimals = (amount: number, decimals: number = 6): number =>
  Number(amount.toFixed(decimals));

/**
 * @description convert a token amount to a formatted amount string
 * @param amount - raw token amount
 * @param decimals - number of token decimals
 * @returns a formatted amount string
 */
const getFormattedStringFromTokenAmount = (
  amount: string,
  decimals: number,
) => {
  // slice around potential decimal place
  const a = amount.slice(0, -decimals);
  let b = amount.slice(-decimals);

  // if b is only 0s, amount is either 0 or a
  // if 0, a is '' => 0
  // if a, b is 000000 => a
  if (/^0+$/.test(b)) return a || b;

  // trim trailing zeros from decimal part
  b = b.replace(/0+$/, "");

  // number has a whole part
  if (amount.length > decimals) return a + "." + b;

  // number is a decimal, pad with zeros
  return "0." + "0".repeat(decimals - amount.length) + b;
};

/**
 * @description convert a formatted amount string to a raw token amount
 * @param amount - formatted string
 * @param decimals - number of token decimals
 * @returns the raw token amount
 */
const getTokenAmountFromFormattedString = (
  amount: string,
  decimals: number,
): bigint => {
  // assume containing e indicates an exponential value
  if (amount.includes("e")) {
    return BigInt(
      Number(amount).toLocaleString("fullwide", { useGrouping: false }),
    );
  }
  const [whole, dec] = amount.split(".");

  // covert the whole portion to a token amount
  const wholeBig = getTokenAmountFromFormatted(BigInt(whole || 0), decimals);

  if (dec === undefined) {
    return wholeBig;
  }

  // convert the decimal portion to a token amount
  const decimalsBig = BigInt(dec) * BigInt(10 ** (decimals - dec.length));

  return wholeBig + decimalsBig;
};

/**
 * @description scale a formatted amount string by the price of the pool
 * @param amount - formatted string
 * @param price - the pool price as a regular number, scaled up by fUSDC decimals
 * @param decimalsFusdc - the decimals of fUSDC
 * @returns the scaled price amount in USD
 */
const getFormattedPriceFromAmount = (
  amount: string,
  price: string | bigint,
  decimalsFusdc: number,
): number => (Number(amount) * Number(price)) / 10 ** decimalsFusdc;

// convert a tick to a formatted price, scaled by decimals
const getFormattedPriceFromTick = (
  tick: number,
  decimals0: number,
  decimals1: number,
) => {
  const ratio = getSqrtRatioAtTick(BigInt(tick));
  const priceUnscaled = Number(sqrtPriceX96ToPrice(ratio, decimals0));
  // adjust for decimals
  const scale = 10 ** -decimals1;
  const formattedPrice = usdFormat(priceUnscaled * scale);
  // display '∞ ' if the price is greater than $10e18 after scaling
  return formattedPrice.length > 20 ? "∞ " : formattedPrice;
};

const getUsdTokenAmountsForPosition = async (
  position: Pick<Position, "positionId" | "lower" | "upper">,
  token0: Token,
  tokenPrice: number,
): Promise<[number, number]> => {
  const positionLiquidity = await simulateContract(config, {
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "positionLiquidity8D11C045",
    args: [token0.address, BigInt(position.positionId)],
  });
  const curTick = await simulateContract(config, {
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "curTick181C6FD9",
    args: [token0.address],
  });

  const [amount0Unscaled, amount1Unscaled] = getTokenAmountsNumeric(
    Number(positionLiquidity.result),
    Number(getSqrtRatioAtTick(BigInt(curTick.result))),
    position.lower,
    position.upper,
  );
  const amount0 =
    (amount0Unscaled * tokenPrice) / 10 ** (token0.decimals + fUSDC.decimals);
  const amount1 = amount1Unscaled / 10 ** fUSDC.decimals;

  return [amount0, amount1];
};

export {
  getFormattedStringFromTokenAmount,
  snapAmountToDecimals,
  getTokenAmountFromFormattedString,
  getFormattedPriceFromAmount,
  getFormattedPriceFromTick,
  getUsdTokenAmountsForPosition,
};
