import { create } from "zustand";
import { Token, fUSDC, DefaultToken } from "@/config/tokens";
import {
  getFormattedStringFromTokenAmount,
  getTokenAmountFromFormattedString,
} from "@/lib/amounts";

interface SwapStore {
  token0: Token;
  token1: Token;

  setToken0: (token: Token) => void;
  setToken1: (token: Token) => void;
  flipTokens: () => void;

  // raw token amounts to be passed to the contract
  token0AmountRaw?: string;
  token1AmountRaw?: string;

  // display token amounts to be shown to a user
  token0Amount?: string;
  token1Amount?: string;

  // parse and set from a display amount
  setToken0Amount: (amount: string, balanceRaw?: string) => void;
  setToken1Amount: (amount: string, balanceRaw?: string) => void;

  setToken0AmountRaw: (amountRaw: string) => void;
  setToken1AmountRaw: (amountRaw: string) => void;

  gas: bigint;
  setGas: (amount: bigint) => void;

  // fee Percentage taken from graph
  feePercentage: number;
  setFeePercentage: (fee: number) => void;
}

export const useSwapStore = create<SwapStore>((set) => ({
  token0: fUSDC,
  token1: DefaultToken,

  setToken0: (token) => set({ token0: token }),
  setToken1: (token) => set({ token1: token }),
  flipTokens: () => {
    set(
      ({
        token0,
        token1,
        token1Amount,
        token0Amount,
        token0AmountRaw,
        token1AmountRaw,
      }) => ({
        token0: token1,
        token1: token0,
        token0Amount:
          token1Amount === "." || token1Amount === "" ? "0" : token1Amount,
        token1Amount:
          token0Amount === "." || token0Amount === "" ? "0" : token0Amount,
        token0AmountRaw: token1AmountRaw,
        token1AmountRaw: token0AmountRaw,
      }),
    );
  },

  token0AmountRaw: undefined,
  token1AmountRaw: "0.87",

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
  gas: 0n,
  setGas: (gas) => set({ gas }),
  feePercentage: 0,
  setFeePercentage: (fee) => set({ feePercentage: 100 / (fee * 100) }),
}));
