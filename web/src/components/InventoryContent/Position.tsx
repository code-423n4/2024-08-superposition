import Token from "@/assets/icons/token.svg";
import { usdFormat } from "@/lib/usdFormat";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ArrowUpRight from "@/assets/icons/arrow-up-right.svg";
import { myPositionsData } from "@/components/InventoryContent/data/myPositionsData";
import PositionIcon from "@/assets/icons/position.svg";

export const Position = ({
  position,
}: {
  position: (typeof myPositionsData)[number];
}) => {
  return (
    <div key={position.id}>
      {/* only on mobile */}
      <div className="relative h-[83px] w-[77px] md:hidden">
        <div className="absolute left-0 top-0 inline-flex items-start justify-start gap-2.5 rounded-[7px] border border-gray-200 bg-stone-900 px-[5px] pb-[5px] pt-2.5">
          <div className="relative h-[68px] w-[67px]">
            <div className="absolute left-[14px] top-0 flex h-[22.57px] w-[39.63px] flex-row">
              <Token className={"size-[25px] "} />
              <Token className={"-ml-3 size-[25px]"} />
            </div>

            <div className="absolute left-[17.40px] top-[18.37px] inline-flex h-[7px] w-[33px] items-center justify-center gap-[3px] rounded-[25px] border border-white bg-black px-0.5 py-px">
              <div className="iridescent-text text-nowrap text-[4px]">
                {position.pool}
              </div>
            </div>

            <div className="absolute top-[30px] w-full text-center text-xs text-gray-200">
              {usdFormat(position.yield)}
            </div>

            <div
              className={cn(
                "absolute left-[19.40px] top-[45px] text-center text-[4px]",
                {
                  "iridescent-text": position.yield > 0,
                  "text-neutral-400": position.yield === 0,
                },
              )}
            >
              {position.yield > 0 ? "Available Yield" : "No Yield Yet"}
            </div>

            <div className="absolute left-0 top-[55px] inline-flex h-[13px] w-[67px] flex-col items-center justify-center gap-2.5 rounded-[100px] bg-gray-200 px-[5px] py-0.5">
              <div className="inline-flex items-center justify-start">
                <div className="flex h-1.5 items-end justify-center">
                  <PositionIcon className={"h-1.5"} />
                </div>
                <div className="text-nowrap text-[6px] text-black">
                  {position.position} Position
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute left-[6px] top-[6px] size-1 rounded-full bg-green-200" />
      </div>

      {/* only on desktop */}
      <div className="relative hidden h-[159px] w-[145px] md:inline-flex">
        <div className="absolute left-0 top-0 h-[159px] w-[145px] rounded-[5px] border border-gray-200 bg-stone-900" />
        <div className="absolute left-[19px] top-[103px] inline-flex w-[107px] items-center justify-between">
          <div className="relative h-[18px] w-[33.50px]">
            <div className="absolute left-[0.50px] top-[8px] inline-flex h-2.5 w-[33px] items-center justify-start">
              <div className="flex h-1.5 items-end justify-center">
                <PositionIcon className={"-ml-1 h-1.5 invert"} />
              </div>
              <div className=" text-[8px] font-medium text-gray-200">
                {position.position}
              </div>
            </div>
            <div className="absolute left-0 top-0 text-[6px] font-medium text-neutral-400">
              Amount
            </div>
          </div>

          <div className="relative h-[18px] w-[50px]">
            <div className="absolute left-0 top-0  text-[6px] font-medium text-neutral-400">
              Liq. Range
            </div>
            <div className="absolute left-[32px] top-px text-right text-[5px] font-medium text-green-200">
              ●
            </div>
            <div className="absolute left-0 top-[8px] inline-flex h-2.5 w-[50px] items-center justify-start gap-[3px]">
              <div className=" text-[8px] font-medium text-white">
                {position.liquidityRange}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute left-0 top-[37.82px] w-full text-center text-[6px] font-semibold text-neutral-400">
          {position.pool}
        </div>
        <div className="absolute left-[53px] top-[12px] flex h-[20.65px] w-[39.93px] flex-row">
          <Token className={"size-[25px] "} />
          <Token className={"-ml-3 size-[25px]"} />
        </div>
        <div className="absolute top-[52px] inline-flex w-full items-center justify-center">
          <div className="text-center text-[19px] text-gray-200">
            {usdFormat(position.yield)}
          </div>
        </div>
        <div className="absolute top-[82px] inline-flex w-full items-center justify-center">
          <Badge variant={"iridescent"} size={"sm"}>
            Available Yield
          </Badge>
        </div>
        <div className="absolute left-[7px] top-[128px] flex h-[23px] w-[132px] gap-[4px]">
          <Button
            variant={"secondary"}
            size={"sm"}
            className={"h-[23px] flex-1 gap-[3px] text-[9px]"}
          >
            View Pool <ArrowUpRight className={"size-[5px]"} />
          </Button>

          <Button variant={"secondary"} size={"sm"} className={"h-[23px]"}>
            +
          </Button>
        </div>
      </div>
    </div>
  );
};
