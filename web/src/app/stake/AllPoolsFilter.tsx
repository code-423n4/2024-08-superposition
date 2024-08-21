"use client";

import { useState } from "react";
import Search from "@/assets/icons/Search.svg";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export const AllPoolsFilter = () => {
  const [newPools, setNewPools] = useState(false);
  const [boostedPools, setBoostedPools] = useState(false);
  const [myAssets, setMyAssets] = useState(false);

  const showPoolFilters = useFeatureFlag("ui show pool filters");

  if (!showPoolFilters) return <></>;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center border-b border-black pl-2">
        <Search className="size-4" />
        <Input
          variant="no-ring"
          className="h-8 w-[350px] border-0 bg-transparent text-xs"
          placeholder="Search for tokens by name, symbol, or contract address."
        />
      </div>
      <div className="flex flex-row justify-between">
        <Badge
          className={cn("h-5 py-0 pl-0", {
            "bg-transparent text-black hover:bg-white/80": !newPools,
          })}
        >
          <Switch
            id={"new-pools"}
            className={cn("my-0 -ml-2 scale-50", {
              invert: !newPools,
            })}
            checked={newPools}
            onCheckedChange={setNewPools}
          />
          <Label htmlFor={"new-pools"} className="text-2xs">
            New Pools
          </Label>
        </Badge>
        <Badge
          className={cn("h-5 py-0 pl-0", {
            "bg-transparent text-black hover:bg-white/80": !boostedPools,
          })}
        >
          <Switch
            id={"boosted-pools"}
            className={cn("my-0 -ml-2 scale-50", {
              invert: !boostedPools,
            })}
            checked={boostedPools}
            onCheckedChange={setBoostedPools}
          />
          <Label htmlFor={"boosted-pools"} className="text-2xs">
            Boosted Pools
          </Label>
        </Badge>
        <Badge
          className={cn("h-5 py-0 pl-0", {
            "bg-transparent text-black hover:bg-white/80": !myAssets,
          })}
        >
          <Switch
            id={"my-assets"}
            className={cn("my-0 -ml-2 scale-50", {
              invert: !myAssets,
            })}
            checked={myAssets}
            onCheckedChange={setMyAssets}
          />
          <Label htmlFor={"my-assets"} className="text-2xs">
            My Assets
          </Label>
        </Badge>
      </div>
    </div>
  );
};
