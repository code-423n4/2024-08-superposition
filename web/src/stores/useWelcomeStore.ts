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
   * Whether the user is hovering over the welcome screen
   */
  hovering: boolean;

  /**
   * Set the hovering state
   * @param hovering
   */
  setHovering: (hovering: boolean) => void;
}

export const useWelcomeStore = create<WelcomeStore>((set) => ({
  welcome: true,
  setWelcome: (welcome) => set({ welcome }),

  hovering: false,
  setHovering: (hovering) => set({ hovering }),
}));
