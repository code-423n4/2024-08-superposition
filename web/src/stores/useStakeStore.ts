import { create } from "zustand";
import { Token, DefaultToken, fUSDC } from "@/config/tokens";
import {
  MIN_TICK,
  MAX_TICK,
  getTickAtSqrtRatio,
  encodeSqrtPrice,
  getTokenAmountsNumeric,
  getSqrtRatioAtTick,
} from "@/lib/math";
import {
  getFormattedStringFromTokenAmount,
  getTokenAmountFromFormattedString,
} from "@/lib/amounts";

interface StakeStore {
  multiSingleToken: "multi" | "single";
  setMultiSingleToken: (multiSingleToken: "multi" | "single") => void;

  token0: Token;
  setToken0: (token: Token) => void;

  token1: Token;
  setToken1: (token: Token) => void;

  token0Amount: string;
  token1Amount: string;

  token0AmountRaw: string;
  token1AmountRaw: string;

  // parse and set from a display amount
  setToken0Amount: (amount: string, balanceRaw?: string) => void;
  setToken1Amount: (amount: string, balanceRaw?: string) => void;

  setToken0AmountRaw: (amountRaw: string) => void;
  setToken1AmountRaw: (amountRaw: string) => void;

  tickLower: number | undefined;
  tickUpper: number | undefined;

  setTickLower: (tick: number) => void;
  setTickUpper: (tick: number) => void;

  // raw internal value
  delta: bigint;

  // input field
  deltaDisplay: string;
  setDelta: (value: string, tick: bigint, max?: bigint) => void;

  priceLower: string;
  priceUpper: string;

  // parse and set from a display amount
  setPriceLower: (tick: string, decimals: number) => void;
  setPriceUpper: (tick: string, decimals: number) => void;

  // fee Percentage taken from graph
  feePercentage: number;
  setFeePercentage: (fee: number) => void;
}

export const useStakeStore = create<StakeStore>((set) => ({
  multiSingleToken: "multi",
  setMultiSingleToken: (multiSingleToken) => set({ multiSingleToken }),

  token0: DefaultToken,
  setToken0: (token0) => set({ token0 }),

  token1: fUSDC,
  setToken1: (token1) => set({ token1 }),

  token0Amount: "",
  token1Amount: "",
  token0AmountRaw: "",
  token1AmountRaw: "",
  setToken0AmountRaw: (amountRaw: string) =>
    set(({ token0 }) => ({
      token0AmountRaw: amountRaw,
      token0Amount: getFormattedStringFromTokenAmount(
        amountRaw,
        token0.decimals,
      ),
    })),
  setToken1AmountRaw: (amountRaw: string) =>
    set(({ token1 }) => ({
      token1AmountRaw: amountRaw,
      token1Amount: getFormattedStringFromTokenAmount(
        amountRaw,
        token1.decimals,
      ),
    })),

  setToken0Amount: (amount, balanceRaw) => {
    set(({ token0, token0Amount, setToken0AmountRaw }) => {
      const validNumber =
        (!amount.includes(" ") && !isNaN(Number(amount))) || amount === ".";
      // update display amount if `amount` is valid as a display number
      if (!validNumber) return { token0Amount };
      try {
        const amountRaw = getTokenAmountFromFormattedString(
          amount,
          token0.decimals,
        );
        // update raw amount if it doesn't exceed balance
        if (!balanceRaw || amountRaw <= BigInt(balanceRaw))
          setToken0AmountRaw(amountRaw.toString());
      } catch {}
      return { token0Amount: amount };
    });
  },
  setToken1Amount: (amount, balanceRaw) => {
    set(({ token1, token1Amount, setToken1AmountRaw }) => {
      const validNumber =
        (!amount.includes(" ") && !isNaN(Number(amount))) || amount === ".";
      // update display amount if `amount` is valid as a display number
      if (!validNumber) return { token1Amount };
      try {
        const amountRaw = getTokenAmountFromFormattedString(
          amount,
          token1.decimals,
        );
        // update raw amount if it doesn't exceed balance
        if (!balanceRaw || amountRaw <= BigInt(balanceRaw))
          setToken1AmountRaw(amountRaw.toString());
      } catch {}
      return { token1Amount: amount };
    });
  },

  tickLower: MIN_TICK,
  tickUpper: MAX_TICK,

  setTickLower: (tick) => set({ tickLower: tick }),
  setTickUpper: (tick) => set({ tickUpper: tick }),

  delta: 0n,
  deltaDisplay: "0",
  setDelta: (liquidity, tick, max) => {
    const validNumber = !liquidity.includes(" ") && !isNaN(Number(liquidity));
    // update display amount if `amount` is valid as a display number
    if (!validNumber) return;
    // always set the display value for input components
    set({ deltaDisplay: liquidity });
    set(({ tickLower, tickUpper, setToken0AmountRaw, setToken1AmountRaw }) => {
      if (tickLower === undefined || tickUpper === undefined) return {};
      // try to derive the new delta and token amounts
      try {
        const delta = BigInt(liquidity);
        const [amount0, amount1] = getTokenAmountsNumeric(
          Number(delta),
          Number(getSqrtRatioAtTick(tick)),
          tickLower,
          tickUpper,
        );
        if (!max || BigInt(liquidity) <= max) {
          setToken0AmountRaw(amount0.toString());
          setToken1AmountRaw(amount1.toString());
          return { delta };
        }
      } catch {}
      return {};
    });
  },

  priceLower: "0",
  priceUpper: "0",

  setPriceLower: (price, decimals) => {
    const validNumber =
      (!price.includes(" ") && !isNaN(Number(price))) || price === ".";
    // update display amount if `amount` is valid as a display number
    if (!validNumber) return;
    // Make a best effort to convert the number to a sqrt price, then to a tick.
    const rawPrice = getTokenAmountFromFormattedString(price, fUSDC.decimals);
    const priceN = Number(rawPrice);
    let tick = 0;
    try {
      const newTick = getTickAtSqrtRatio(
        encodeSqrtPrice(priceN * 10 ** -decimals),
      );
      tick = newTick;
    } catch {}
    set({
      tickLower: tick,
      priceLower: price,
    });
  },
  setPriceUpper: (price, decimals) => {
    const validNumber =
      (!price.includes(" ") && !isNaN(Number(price))) || price === ".";
    // update display amount if `amount` is valid as a display number
    if (!validNumber) return;

    const rawPrice = getTokenAmountFromFormattedString(price, fUSDC.decimals);
    const priceN = Number(rawPrice);
    let tick = 0;
    try {
      const newTick = getTickAtSqrtRatio(
        encodeSqrtPrice(priceN * 10 ** -decimals),
      );
      tick = newTick;
    } catch {}
    set({
      tickUpper: tick,
      priceUpper: price,
    });
  },
  feePercentage: 0,
  setFeePercentage: (fee) => set({ feePercentage: 100 / (fee * 100) }),
}));
