import { Badge } from "@/components/ui/badge";
import Token from "@/assets/icons/token.svg";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useStakeWelcomeBackStore } from "@/stores/useStakeWelcomeBackStore";
import { useInventorySheet } from "@/stores/useInventorySheet";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export const MyYieldUnclaimed = () => {
  const router = useRouter();

  const { setYieldBreakdown } = useStakeWelcomeBackStore();
  const { setIsOpen } = useInventorySheet();

  const showClaimAllYield = useFeatureFlag("ui show claim all yield");

  return (
    <div className="flex flex-col items-center">
      <div className={"mt-[14px] text-[30px]"}>$41.12</div>

      <div>
        <Badge className={"h-[14px] px-0.5 text-[8px]"}>
          <Token />
          <Token className={"-ml-1"} />
          <Token className={"-ml-1"} />
          <Token className={"-ml-1 mr-1"} />
          Unclaimed Rewards
        </Badge>
      </div>

      <div
        className={"mt-[18px] flex h-[64px] w-[240px] flex-col justify-between"}
      >
        <div className={"flex w-full flex-row justify-between text-[10px]"}>
          <div>Pool Fees</div>
          <div className="flex flex-row items-center gap-1">
            <Token /> $21.72
          </div>
        </div>

        <div className={"flex w-full flex-row justify-between text-[10px]"}>
          <div>Liquidity Boosts</div>
          <div className="flex flex-row items-center gap-1">
            <Token /> $13.06
          </div>
        </div>

        <div className={"flex w-full flex-row justify-between text-[10px]"}>
          <div>Super Boosts</div>
          <div className="flex flex-row items-center gap-1">
            <Token /> $8.34
          </div>
        </div>

        <div className={"flex w-full flex-row justify-between text-[10px]"}>
          <div>Utility Boosts</div>
          <div className="flex flex-row items-center gap-1">
            <Token /> $2.99
          </div>
        </div>
      </div>

      {showClaimAllYield && (
        <Button
          className={"mt-[17px] w-full"}
          onClick={() => {
            setYieldBreakdown(true);
            setIsOpen(false);
            router.push("/stake");
          }}
        >
          <div className={"iridescent-text text-[10px]"}>Claim All Yield</div>
        </Button>
      )}

      <Badge
        className={"-mt-1.5 h-[12px] gap-1 border border-black px-1 text-[7px]"}
        variant={"iridescent"}
      >
        <Token className={"size-[10px]"} />
        <div>$41.12</div>
      </Badge>
    </div>
  );
};
