import { cn } from "@/lib/utils";
import SegmentedControl from "@/components/ui/segmented-control";
import { useRef, useState } from "react";
import { useInventorySettings } from "@/components/InventoryContent/useInventorySettings";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const InventorySettings = () => {
  const settings = useInventorySettings((s) => s.settings);

  const [maxSlippage, setMaxSlippage] = useState<"auto" | "custom">("auto");
  const [transactionDeadline, setTransactionDeadline] = useState<
    "none" | "custom"
  >("none");

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center text-[10px] md:text-[12px]",
        {
          hidden: !settings,
        },
      )}
    >
      <div
        className={
          "mt-[40px] flex w-full flex-row items-center justify-between"
        }
      >
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
        <div
          className={
            "mt-[6px] flex  w-full flex-row items-center justify-start"
          }
        >
          <Input
            placeholder={"0.5"}
            className={
              "h-[25px] w-[80px] border-0 bg-zinc-800 text-center text-[12px]"
            }
          />
        </div>
      )}

      <div
        className={
          "mt-[22px] flex w-full flex-row items-center justify-between"
        }
      >
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
  );
};
