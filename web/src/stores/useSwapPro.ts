import { create } from "zustand";

interface SwapProStore {
  /**
   * Whether the swap screen is in "pro" mode
   */
  swapPro: boolean;

  /**
   * Set the swap screen "pro" mode
   * @param swapPro
   */
  setSwapPro: (swapPro: boolean) => void;
}

export const useSwapPro = create<SwapProStore>((set) => ({
  swapPro: false,
  setSwapPro: (swapPro) => set({ swapPro }),
}));
