"use client";

import { useFeatureFlag } from "@/hooks/useFeatureFlag";

/**
 * Show a banner indicating that the data is demo data.
 */
export const DemoData = () => {
  const showDemoData = useFeatureFlag("ui show demo data");

  if (!showDemoData) return null;

  return <div className="text-xs text-red-500">DEMO DATA</div>;
};
