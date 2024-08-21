import { create } from "zustand";

interface InventorySheetStore {
  /**
   * Represents the current state of openness.
   */
  isOpen: boolean;

  /**
   * Sets the state of openness.
   *
   * @param {boolean} isOpen The new state of openness.
   */
  setIsOpen: (isOpen: boolean) => void;
}

/**
 * A store for the InventorySheet component.
 */
export const useInventorySheet = create<InventorySheetStore>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));
