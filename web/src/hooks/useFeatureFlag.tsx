"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useFeatureFlagOverride } from "@/hooks/useFeatureFlagOverride";

export interface FeatureFlags {
  /**
   * Show demo data in the UI.
   * When set to `false`, the UI will fetch data from the GraphQL API.
   */
  "ui show demo data": boolean;

  /**
   * Use mock data for the GraphQL API.
   * This is not used in the web app.
   */
  "graphql mock demo data": boolean;

  /**
   * Show options to pick fee tier in the staking form.
   */
  "ui show manual fees": boolean;

  /**
   * Show the feature flags panel in the UI.
   */
  "ui show feature flags panel": boolean;

  /**
   * Show the Superloop aggregator Popover in the UI.
   */
  "ui show superloop": boolean;

  /**
   * Show the fee tier display in the Stake interface.
   */
  "ui show fee tier": boolean;

  /**
   * Show the optimising fee route mention.
   */
  "ui show optimising fee route": boolean;

  /**
   * Show the "Single-Token" option in the stake form. This implies a swap into the second
   * asset, which may not be supported.
   */
  "ui show single token stake": boolean;

  /**
   * Show the campaign banner with information like a countdown.
   */
  "ui show campaign banner": boolean;

  /**
   * Show the rewards claimed for users to see.
   */
  "ui show rewards claimed": boolean;

  /**
   * Show the incentives screen in the staking page.
   */
  "ui show incentives": boolean;

  /**
   * Show specifically liquidity incentives.
   */
  "ui show liquidity incentives": boolean;

  /**
   * Show the Stake APY in the stake tabs.
   */
  "ui show stake apy": boolean;

  /**
   * Show the my transactions option.
   */
  "ui show my transactions": boolean;

  /**
   * Show the trade rewards.
   */
  "ui show trade rewards": boolean;

  /**
   * Show the boost incentives button.
   */
  "ui show boost incentives": boolean;

  /**
   * Show the utility incentives.
   */
  "ui show utility incentives": boolean;

  /**
   * Show the super incentives.
   */
  "ui show super incentives": boolean;

  /**
   * Show live utility rewards.
   */
  "ui show live utility rewards": boolean;

  /**
   * Show tokens given out.
   */
  "ui show tokens given out": boolean;

  /**
   * Show the pool reward range.
   */
  "ui show pool reward range": boolean;

  /**
   * Show claim yield button.
   */
  "ui show claim yield": boolean;

  /**
   * Show the earned fees APR in the specific pool stake page.
   */
  "ui show earned fees apr": boolean;

  /**
   * Allow users to filter for pools they want.
   */
  "ui show pool filters": boolean;

  /**
   * Show yield over time display for users.
   */
  "ui show yield over time": boolean;

  /**
   * Show claim all yield button, and functionality.
   */
  "ui show claim all yield": boolean;

  /**
   * Show pools tab in inventory drawer.
   */
  "ui show pools tab": boolean;

  /**
   * Show breakdown of fees, rewards, and route in the swap form.
   */
  "ui show swap breakdown": boolean;

  /**
   * Show liquidity range visualiser in the stake form
   */
  "ui show liquidity visualiser": boolean;
}

/**
 * Fetches feature flags from the features API.
 *
 * @param featureFlag The feature flag to fetch
 * @returns The value of the feature flag
 */
export const useFeatureFlag = <T extends keyof FeatureFlags>(
  featureFlag: T,
  skipOverride = false,
): FeatureFlags[T] => {
  const override = useFeatureFlagOverride((s) => s.override);
  const featureFlagOverride = useFeatureFlagOverride((s) => s.featureFlags);

  const { data } = useQuery({
    queryKey: ["featureFlags"],
    queryFn: async () => {
      const response = await fetch("https://features.long.so/features.json");
      return response.json();
    },
  });

  /**
   * If override is enabled, return the value from the override.
   * Otherwise, return the value from the API.
   */
  return useMemo(() => {
    if (skipOverride) return data?.[featureFlag];
    if (override) return featureFlagOverride[featureFlag];
    return data?.[featureFlag];
  }, [skipOverride, override, featureFlagOverride, data, featureFlag]);
};
