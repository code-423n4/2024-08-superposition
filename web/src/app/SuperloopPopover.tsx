"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Cog from "@/assets/icons/cog.svg";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRef, useState } from "react";
import SegmentedControl from "@/components/ui/segmented-control";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Popover which contains the Superloop settings.
 */
export const SuperloopPopover = () => {
  const [maxSlippage, setMaxSlippage] = useState<"auto" | "custom">("auto");
  const [transactionDeadline, setTransactionDeadline] = useState<
    "none" | "custom"
  >("none");

  return (
    <Popover>
      <PopoverTrigger
        aria-label="open settings"
        className={"absolute -top-3 right-0"}
      >
        <div className="flex items-center justify-center rounded-full bg-black p-[4px]">
          <Cog className="relative size-[18px] hover:size-[25px] hover:animate-spin-once" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="bg-black text-xs text-white">
        <div className="flex flex-col gap-2">
          <p className="iridescent-text text-base font-medium">💎 Superloop</p>
          <div className="flex flex-row gap-2">
            <Label htmlFor="superloop" className="text-xs font-normal">
              When available, aggregates liquidity sources for better price and
              gas free swaps.
            </Label>
            <Switch id="superloop" />
          </div>

          <div className="flex w-full flex-row items-center justify-between">
            <div>Max. slippage</div>
            <SegmentedControl
              name={"max-slippage"}
              variant={"secondary"}
              className={"text-[10px] md:text-[12px]"}
              callback={(val) => setMaxSlippage(val)}
              segments={[
                {
                  label: "Auto",
                  value: "auto" as const,
                  ref: useRef(),
                },
                {
                  label: "Custom",
                  value: "custom" as const,
                  ref: useRef(),
                },
              ]}
            />
          </div>

          {maxSlippage === "custom" && (
            <div className={"flex  w-full flex-row items-center justify-start"}>
              <Input
                placeholder={"0.5"}
                className={
                  "h-[25px] w-[80px] border-0 bg-zinc-800 text-center text-[12px]"
                }
              />
            </div>
          )}

          <div className="flex flex-row justify-between">
            <div>Transaction Deadline</div>
            <SegmentedControl
              name={"transaction-deadline"}
              variant={"secondary"}
              className={"text-[10px] md:text-[12px]"}
              callback={(val) => setTransactionDeadline(val)}
              segments={[
                {
                  label: "None",
                  value: "none" as const,
                  ref: useRef(),
                },
                {
                  label: "Custom",
                  value: "custom" as const,
                  ref: useRef(),
                },
              ]}
            />
          </div>

          {transactionDeadline === "custom" && (
            <div
              className={
                "mt-[6px] flex  w-full flex-row items-center justify-start gap-1"
              }
            >
              <Input
                placeholder={"15"}
                className={
                  "h-[25px] w-[80px] border-0 bg-zinc-800 text-center text-[12px]"
                }
              />

              <Select defaultValue={"minutes"}>
                <SelectTrigger className="h-6 w-auto border-0 bg-black p-0 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">minutes</SelectItem>
                  <SelectItem value="hours">hours</SelectItem>
                  <SelectItem value="days">days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
