"use client";

import { useRef, useState } from "react";
import SegmentedControl from "@/components/ui/segmented-control";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TradeTabContent } from "@/components/InventoryContent/TradeTabContent";
import { PoolsTabContent } from "@/components/InventoryContent/PoolsTabContent";
import { InventoryHeader } from "@/components/InventoryContent/InventoryHeader";
import { cn } from "@/lib/utils";
import { useInventorySettings } from "@/components/InventoryContent/useInventorySettings";
import { InventorySettings } from "@/components/InventoryContent/InventorySettings";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export const InventoryContent = () => {
  const [content, setContent] = useState<"pools" | "trade">("trade");

  const showPoolsTab = useFeatureFlag("ui show pools tab");

  const settings = useInventorySettings((s) => s.settings);
  const tradesRef = useRef();
  const poolsRef = useRef();
  return (
    <div className="flex flex-col items-center">
      <InventoryHeader />

      <InventorySettings />

      <div
        className={cn("flex flex-col items-center", {
          hidden: settings,
        })}
      >
        <div className="mt-[29px] flex flex-col items-center md:mt-[34px]">
          <SegmentedControl
            name={"inventory-content"}
            variant={"secondary"}
            callback={(val) => setContent(val)}
            segments={[
              {
                label: "Trades",
                value: "trade" as const,
                ref: tradesRef,
              },
              ...(showPoolsTab
                ? [
                    {
                      label: "Pools",
                      value: "pools" as const,
                      ref: poolsRef,
                    },
                  ]
                : []),
            ]}
          />
        </div>

        <Tabs defaultValue="trade" value={content}>
          <TabsContent value="trade">
            <TradeTabContent />
          </TabsContent>
          <TabsContent value="pools">
            <PoolsTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
