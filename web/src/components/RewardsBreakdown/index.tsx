import { cn } from "@/lib/utils";
import Token from "@/assets/icons/token.svg";
import { Badge } from "@/components/ui/badge";

interface RewardsBreakdownProps {
  hidden: boolean;
}

export const RewardsBreakdown = ({ hidden = false }: RewardsBreakdownProps) => (
  <div
    className={cn(
      "mt-[15px] h-[140px] w-[317px] rounded-lg bg-black px-[15px] py-[17px] text-white md:mt-[22px] md:h-[140px] md:w-[393px]",
      {
        hidden,
      },
    )}
  >
    <div className={"text-[12px]"}>Rewards Breakdown</div>
    <div className={"mt-[10px] flex flex-col gap-[4px] "}>
      <div className={"flex flex-row justify-between text-[10px]"}>
        <div>Fluid Rewards</div>
        <div className={"iridescent-text flex flex-row items-center gap-1"}>
          <Token />
          <div>$0 - $21.72</div>
        </div>
      </div>
      <div className={"flex flex-row justify-between text-[10px]"}>
        <div>Trader Rewards</div>
        <div className={"iridescent-text flex flex-row items-center gap-1"}>
          <Token />
          <div>$5.91 - $8.34</div>
        </div>
      </div>
      <div className={"flex flex-row justify-between text-[10px]"}>
        <div>Super Rewards</div>
        <div className={"iridescent-text flex flex-row items-center gap-1"}>
          <Token />
          <Token className={"-ml-2"} />
          <div>$0.20 - $13.06</div>
        </div>
      </div>
    </div>
    <div
      className={
        "mt-[10px] flex flex-row items-center justify-between text-[10px]"
      }
    >
      <div className={"font-semibold"}>Total</div>
      <Badge
        variant="iridescent"
        className="h-[17px] px-1 text-2xs font-normal"
      >
        <Token />
        <Token className={"-ml-1"} />
        <Token className={"-ml-1 mr-1"} />
        <div>$6.11 - $33.12</div>
      </Badge>
    </div>
  </div>
);
