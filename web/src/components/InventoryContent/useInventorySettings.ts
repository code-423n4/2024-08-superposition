import { create } from "zustand";

export const useInventorySettings = create<{
  /**
   * True when settings are open
   */
  settings: boolean;

  /**
   * Set the settings state
   */
  setSettings: (settings: boolean) => void;
}>((set) => ({
  settings: false,
  setSettings: (settings: boolean) => set({ settings }),
}));
