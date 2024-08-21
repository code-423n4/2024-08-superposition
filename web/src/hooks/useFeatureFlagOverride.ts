import { create } from "zustand";
import { FeatureFlags } from "@/hooks/useFeatureFlag";
import { persist } from "zustand/middleware";

/**
 * Zustand hook to override feature flags for local development.
 */
export const useFeatureFlagOverride = create(
  persist<{
    override: boolean;
    setOverride: (value: boolean) => void;
    featureFlags: Partial<FeatureFlags>;
    setFeatureFlagOverride: (
      featureFlag: keyof FeatureFlags,
      value: boolean,
    ) => void;
  }>(
    (set) => ({
      override: false,
      setOverride: (value) => set({ override: value }),
      featureFlags: {},
      setFeatureFlagOverride: (featureFlag, value) =>
        set((state) => ({
          featureFlags: {
            ...state.featureFlags,
            [featureFlag]: value,
          },
        })),
    }),
    {
      name: "feature-flag-override",
    },
  ),
);
