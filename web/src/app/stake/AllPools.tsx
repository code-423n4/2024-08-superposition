"use client";

import List from "@/assets/icons/list.svg";
import Grid from "@/assets/icons/grid.svg";
import { AllPoolsTable } from "@/app/stake/_AllPoolsTable/AllPoolsTable";
import { columns, Pool } from "@/app/stake/_AllPoolsTable/columns";
import { useMemo, useRef, useState } from "react";
import { AllPoolsFilter } from "@/app/stake/AllPoolsFilter";
import SegmentedControl from "@/components/ui/segmented-control";
import { Badge } from "@/components/ui/badge";
import IridescentToken from "@/assets/icons/iridescent-token.svg";
import Token from "@/assets/icons/token.svg";
import { usdFormat } from "@/lib/usdFormat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Position from "@/assets/icons/position.svg";
import Pickaxe from "@/assets/icons/iridescent-pickaxe-2.svg";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { mockAllPools } from "@/demoData/allPools";
import { LoaderIcon } from "lucide-react";
import { useGraphqlGlobal } from "@/hooks/useGraphql";
import { sum } from "lodash";
import { graphql, useFragment } from "@/gql";
import { useRouter } from "next/navigation";
import { getFormattedPriceFromTick } from "@/lib/amounts";
import { fUSDC, getTokenFromAddress } from "@/config/tokens";
import { TokenIcon } from "@/components/TokenIcon";

const DisplayModeMenu = ({
  setDisplayMode,
}: {
  setDisplayMode: (mode: "list" | "grid") => void;
}) => {
  return (
    <SegmentedControl
      name={"display-mode"}
      callback={(val) => setDisplayMode(val)}
      segments={[
        {
          label: (
            <div className={"flex flex-row items-center gap-1"}>
              <List className={"invert"} />
              List
            </div>
          ),
          value: "list",
          ref: useRef(),
        },
        {
          label: (
            <div className={"flex flex-row items-center gap-1"}>
              <Grid className={"invert"} />
              Grid
            </div>
          ),
          value: "grid",
          ref: useRef(),
        },
      ]}
    />
  );
};

export const AllPoolsFragment = graphql(`
  fragment AllPoolsFragment on SeawaterPool {
    address
    token {
      name
      decimals
    }
    volumeOverTime {
      daily {
        fusdc {
          valueScaled
        }
      }
    }
    tvlOverTime {
      daily
    }
    liquidityOverTime {
      daily {
        fusdc {
          valueScaled
        }
      }
    }
    positions {
      positions {
        lower
        upper
      }
    }
  }
`);

export const AllPools = () => {
  const [displayMode, setDisplayMode] = useState<"list" | "grid">("list");

  const { data, isLoading } = useGraphqlGlobal();

  const router = useRouter();

  const poolsData = useFragment(AllPoolsFragment, data?.pools);

  const showDemoData = useFeatureFlag("ui show demo data");
  const showRewardsClaimed = useFeatureFlag("ui show rewards claimed");
  const showIncentives = useFeatureFlag("ui show incentives");

  const pools = useMemo(() => {
    if (showDemoData) return mockAllPools;

    // reformat the data to match the Pool type
    return poolsData?.map((pool): Pool => {
      const volume = (() => {
        if (pool.volumeOverTime.daily.length > 0)
          return parseFloat(
            pool.volumeOverTime.daily?.[0].fusdc.valueScaled ?? 0,
          );
        return 0;
      })();
      const totalValueLocked = (() => {
        if (pool.tvlOverTime.daily.length > 0)
          return parseFloat(pool.tvlOverTime.daily[0] ?? 0);
        return 0;
      })();

      const liquidityRange = pool.positions.positions
        .reduce(
          ([min, max], position) => [
            position.lower < min ? position.lower : min,
            position.upper > max ? position.upper : max,
          ],
          [0, 0],
        )
        .map((tick) =>
          getFormattedPriceFromTick(tick, pool.token.decimals, fUSDC.decimals),
        ) as [string, string];

      return {
        id: pool.address,
        tokens: [
          {
            name: pool.token.name,
          },
          {
            name: "fUSDC",
          },
        ],
        // assume that the first daily value is the current value
        volume: volume,
        totalValueLocked: totalValueLocked,
        rewards: 0, // should display the accumulated supply of the rewards
        liquidityRange,
        // TODO: I don't know where to get the following info from
        boosted: false,
        fees: 0,
        claimable: false,
        annualPercentageYield: 0,
      };
    });
  }, [showDemoData, poolsData]);

  const poolTvlSummed = sum(
    poolsData?.map((pool) => parseFloat(pool.tvlOverTime.daily[0])),
  );

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mt-4 flex w-full max-w-screen-lg flex-col gap-4">
        <div className="flex flex-row justify-between">
          <div className="text-2xs md:text-sm">All Pools</div>

          {/* only shown on mobile */}
          <div className="md:hidden">
            <DisplayModeMenu setDisplayMode={setDisplayMode} />
          </div>
        </div>

        <div className="flex flex-row flex-wrap justify-center gap-4">
          <div className="flex flex-1 flex-row justify-between">
            <div className="flex flex-col">
              <div className="text-3xs md:text-2xs">TVL</div>
              <div className="text-2xl md:text-3xl">
                {showDemoData
                  ? "12.1M"
                  : // sum the tvl of all pools, assume the first daily value is the current value
                    usdFormat(poolTvlSummed ? poolTvlSummed : 0)}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-3xs md:text-2xs">Incentives</div>
              <div className="text-2xl md:text-3xl">
                {
                  !showIncentives ? "-" : showDemoData ? "200k" : 0 // sum the liquidity incentives of all pools
                }
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-3xs md:text-2xs">Rewards Claimed</div>
              <div className="text-2xl md:text-3xl">
                {showRewardsClaimed ? "59.1K" : "-"}
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-row justify-center gap-4">
            <AllPoolsFilter />

            {/* not shown on mobile */}
            <div className="hidden flex-col justify-end md:flex">
              <div>
                <DisplayModeMenu setDisplayMode={setDisplayMode} />
              </div>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className={"flex flex-col items-center"}>
            <LoaderIcon className="size-8 animate-spin" />
          </div>
        )}

        {displayMode === "list" && pools && (
          <AllPoolsTable columns={columns} data={pools} />
        )}

        {displayMode === "grid" && (
          <div
            className={"mt-[30px] flex flex-row flex-wrap gap-[20px] pl-[12px]"}
          >
            {pools?.map((pool) => (
              <div
                key={pool.id}
                className={
                  "relative h-[169px] w-[179px] rounded-[5px] bg-black text-white"
                }
              >
                <div className={"absolute -left-1 -top-2 flex flex-row"}>
                  <TokenIcon
                    src={getTokenFromAddress(pool.id)?.icon}
                    className={"size-[24px] rounded-full"}
                  />
                  <Badge
                    variant={"outline"}
                    className={"-ml-1.5 bg-black pl-0.5 text-white"}
                  >
                    <IridescentToken className={"size-[18px]"} />
                    {pool.tokens[0].name}-{pool.tokens[1].name}
                  </Badge>
                </div>

                {pool.boosted && (
                  <div className={"absolute -right-1 -top-3"}>
                    <Badge
                      variant={"iridescent"}
                      className={
                        "h-4 gap-0.5 border border-black px-0.5 text-[9px]"
                      }
                    >
                      <Pickaxe />
                      Boosted
                    </Badge>
                  </div>
                )}

                <div
                  className={
                    "mt-[34px] w-full text-center text-xl font-semibold"
                  }
                >
                  {usdFormat(pool.rewards)}
                </div>

                <div className={"mt-[5px] flex flex-row justify-center"}>
                  <Badge
                    variant={pool.boosted ? "iridescent" : "outline"}
                    className={cn("h-3.5 gap-[3px] pl-0.5 text-[8px]", {
                      "text-white": !pool.boosted,
                    })}
                  >
                    <div className={"flex flex-row"}>
                      <Token className={"size-[10px]"} />
                      <Token className={"-ml-1 size-[10px]"} />
                      <Token className={"-ml-1 size-[10px]"} />
                    </div>
                    <div>Available Yield</div>
                  </Badge>
                </div>

                <div
                  className={
                    "mt-[16px] flex flex-row justify-between px-[21px]"
                  }
                >
                  <div className={"flex flex-col"}>
                    <div className={"text-[10px] text-neutral-400"}>Amount</div>
                    <div className={"flex flex-row items-center gap-1 text-xs"}>
                      <Position className={"invert"} />
                      {usdFormat(pool.volume)}
                    </div>
                  </div>
                  <div className={"flex flex-col"}>
                    <div
                      className={
                        "flex flex-row items-center text-[10px] text-neutral-400"
                      }
                    >
                      Liq. Range{" "}
                      <div className="w-1.5 text-right text-[5px] font-medium text-green-200">
                        ●
                      </div>
                    </div>
                    <div className={"text-xs"}>
                      {pool.liquidityRange[0]}-{pool.liquidityRange[1]}
                    </div>
                  </div>
                </div>

                <div className={"mt-[10px] flex flex-row gap-2 px-2"}>
                  <Button
                    onClick={() => router.push(`/stake/pool?id=${pool.id}`)}
                    variant={"secondary"}
                    size={"sm"}
                    className={"flex h-[23px] flex-1 text-[9px]"}
                  >
                    View Pool
                  </Button>
                  <Button
                    onClick={() =>
                      router.push(`/stake/pool/create?id=${pool.id}`)
                    }
                    variant={"secondary"}
                    size={"sm"}
                    className={"h-[23px] text-[9px]"}
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
