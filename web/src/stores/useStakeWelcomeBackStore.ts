import { create } from "zustand";

interface WelcomeStore {
  /**
   * Whether the welcome screen is visible
   */
  welcome: boolean;

  /**
   * Set the welcome screen visibility
   * @param welcome
   */
  setWelcome: (welcome: boolean) => void;

  /**
   * Whether the yield breakdown screen is visible
   */
  yieldBreakdown: boolean;

  /**
   * Set the yield breakdown screen visibility
   * @param yieldBreakdown
   */
  setYieldBreakdown: (yieldBreakdown: boolean) => void;

  yieldBreakdownClaimed: boolean;
  setYieldBreakdownClaimed: (yieldBreakdownClaimed: boolean) => void;
}

export const useStakeWelcomeBackStore = create<WelcomeStore>((set) => ({
  welcome: false,
  setWelcome: (welcome) => set({ welcome }),

  yieldBreakdown: false,
  setYieldBreakdown: (yieldBreakdown) => set({ yieldBreakdown }),

  yieldBreakdownClaimed: false,
  setYieldBreakdownClaimed: (yieldBreakdownClaimed) =>
    set({ yieldBreakdownClaimed }),
}));
