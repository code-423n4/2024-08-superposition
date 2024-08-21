"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import List from "@/assets/icons/list.svg";
import Grid from "@/assets/icons/grid.svg";
import { cn } from "@/lib/utils";
import { MyPositionsTable } from "@/app/stake/_MyPositionsTable/MyPositionsTable";
import { columns, Pool } from "@/app/stake/_MyPositionsTable/columns";
import { Badge } from "@/components/ui/badge";
import { usdFormat } from "@/lib/usdFormat";
import Position from "@/assets/icons/position.svg";
import { output as seawaterContract } from "@/lib/abi/ISeawaterAMM";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";
import { motion } from "framer-motion";
import Link from "next/link";
import TokenIridescent from "@/assets/icons/token-iridescent.svg";
import SegmentedControl from "@/components/ui/segmented-control";
import { useAccount, useSimulateContract, useWriteContract } from "wagmi";
import { mockMyPositions } from "@/demoData/myPositions";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { graphql, useFragment } from "@/gql";
import { useGraphqlUser } from "@/hooks/useGraphql";
import { Token, fUSDC, getTokenFromAddress } from "@/config/tokens";
import { TokenIcon } from "@/components/TokenIcon";
import { ammAddress } from "@/lib/addresses";
import { useStakeStore } from "@/stores/useStakeStore";
import { sqrtPriceX96ToPrice } from "@/lib/math";
import { usePositions } from "@/hooks/usePostions";

export const MyPositions = () => {
  const [displayMode, setDisplayMode] = useState<"list" | "grid">("list");

  const [expanded, setExpanded] = useState(false);

  const router = useRouter();

  const { address } = useAccount();
  const { token0 } = useStakeStore();

  const showDemoData = useFeatureFlag("ui show demo data");
  const showClaimAllYield = useFeatureFlag("ui show claim all yield");

  const { positions: walletData } = usePositions();

  // this is every position, with their respective pools
  const pools = useMemo((): Pool[] | undefined => {
    if (showDemoData && address) return mockMyPositions;

    return walletData
      .map((position) => ({
        positionId: position.positionId,
        id: position.pool.token.address,
        duration: Math.round(
          // now - created
          (new Date().valueOf() - new Date(position.created * 1000).valueOf()) /
            // converted to minutes
            1000 /
            60,
        ),
        tokens: [
          fUSDC,
          {
            name: position.pool.token.name,
            address: position.pool.token.address as `0x${string}`,
            symbol: position.pool.token.symbol,
            decimals: position.pool.token.decimals,
          },
        ] satisfies [Token, Token],
        staked:
          parseFloat(position.liquidity.fusdc.valueUsd) +
          parseFloat(position.liquidity.token1.valueUsd),
        // TODO set this based on unclaimedRewardsData
        totalYield: 0,
      }))
      .filter((position) => position.staked > 0);
  }, [showDemoData, address, walletData]);

  const { data: poolSqrtPriceX96 } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "sqrtPriceX967B8F5FC5",
    args: [token0.address],
  });

  const tokenPrice = poolSqrtPriceX96
    ? sqrtPriceX96ToPrice(poolSqrtPriceX96.result, token0.decimals)
    : 0n;

  const {
    writeContract: writeContractCollect,
    data: collectData,
    error: collectError,
    isPending: isCollectPending,
  } = useWriteContract();

  const collectArgs = useMemo(
    () =>
      [
        pools?.map((p) => p.id as `0x${string}`) ?? [],
        pools?.map((p) => BigInt(p.positionId)) ?? [],
      ] as const,
    [pools],
  );

  const { data: unclaimedRewardsData } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "collect7F21947C",
    args: collectArgs,
  });

  const unclaimedRewards = useMemo(() => {
    if (!unclaimedRewardsData) return "$0.00";

    const rewards = unclaimedRewardsData.result.reduce((p, c) => {
      const token0AmountScaled =
        (Number(c.amount0) * Number(tokenPrice)) /
        10 ** (token0.decimals + fUSDC.decimals);
      const token1AmountScaled = Number(c.amount1) / 10 ** fUSDC.decimals;
      return p + token0AmountScaled + token1AmountScaled;
    }, 0);
    return usdFormat(rewards);
  }, [unclaimedRewardsData, token0, tokenPrice]);

  const collectAll = useCallback(() => {
    writeContractCollect({
      address: ammAddress,
      abi: seawaterContract.abi,
      functionName: "collect7F21947C",
      args: collectArgs,
    });
  }, [writeContractCollect, collectArgs]);

  return (
    <motion.div
      layoutId="modal"
      className={cn(
        "flex h-[240px] w-full flex-col gap-2 rounded-lg bg-black p-4 pb-2 text-white transition-[height] md:h-[248px]",
        {
          "h-[412px]": expanded,
        },
      )}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="text-3xs md:text-2xs">My Positions</div>

        <SegmentedControl
          variant={"secondary"}
          callback={(val) => setDisplayMode(val)}
          segments={[
            {
              label: (
                <div className={"flex flex-row items-center gap-1"}>
                  <List />
                  List
                </div>
              ),
              value: "list",
              ref: useRef(),
            },
            {
              label: (
                <div className={"flex flex-row items-center gap-1"}>
                  <Grid />
                  Grid
                </div>
              ),
              value: "grid",
              ref: useRef(),
            },
          ]}
        />
      </div>

      <div
        className={cn("h-[180px] overflow-y-auto transition-[height]", {
          "h-[300px]": expanded,
        })}
      >
        {!pools || pools?.length === 0 ? (
          <div className="flex min-h-[149px] flex-col items-center justify-center">
            <div className="text-2xs">
              Your active positions will appear here.
            </div>
          </div>
        ) : displayMode === "list" ? (
          pools && <MyPositionsTable columns={columns} data={pools} />
        ) : (
          <motion.div
            layout
            className={cn("flex flex-row items-center justify-around gap-4", {
              "mb-4 flex-wrap": expanded,
            })}
          >
            {pools?.map((pool) => (
              <motion.div
                layout
                key={pool.id}
                className="flex h-[83px] w-[77px] cursor-pointer flex-col items-center rounded-xl border border-white p-2 md:h-[120px] md:min-w-[111px] md:gap-1"
                onClick={() =>
                  router.push(
                    `/stake/pool?id=${pool.id}&positionId=${pool.positionId}`,
                  )
                }
              >
                <div className="flex w-full flex-row">
                  <div className="size-1 rounded-full bg-red-500 md:size-2" />
                </div>

                <div className="-mt-1 flex flex-col md:-mt-2">
                  <div className="flex flex-row">
                    <TokenIcon
                      src={getTokenFromAddress(pool.id)?.icon}
                      className="ml-[-2px] size-[25px] rounded-full border border-black md:size-[35px]"
                    />
                    <TokenIridescent className="ml-[-6px] size-[25px] rounded-full border-2 border-black md:size-[35px]" />
                  </div>
                  <div className="flex flex-row justify-center">
                    <Badge
                      variant="outline"
                      className="z-20 -mt-1 text-nowrap bg-black p-0 px-px text-[4px] text-white md:-mt-2 md:px-[2px] md:text-3xs"
                    >
                      {pool.tokens[0].name}
                      {" x "}
                      {pool.tokens[1].name}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-xs md:text-sm">
                    {usdFormat(pool.staked)}
                  </div>
                  <div className="mt-[-2px] text-[4px] text-gray-2 md:text-3xs">
                    No Yield Yet
                  </div>
                </div>
                <Badge
                  onClick={() =>
                    router.push(
                      `/stake/pool?id=${pool.id}&positionId=${pool.positionId}`,
                    )
                  }
                  variant="secondary"
                  className="mt-[5px] h-6 w-full justify-center gap-1 text-nowrap p-0 px-1 text-2xs"
                >
                  <Position className={"size-[6px] md:size-[10px]"} />
                  <div className="text-4xs md:text-3xs">
                    {usdFormat(pool.staked)} Position
                  </div>
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {pools && pools.length > 0 && (
        <div className="flex flex-col items-center md:hidden">
          <Button
            variant="link"
            className="group flex h-6 flex-row gap-2 text-2xs text-white hover:no-underline"
            size={"sm"}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <div className="group-hover:underline">Hide</div>
                <div className="-rotate-90">{"->"}</div>
              </>
            ) : (
              <>
                <div className="group-hover:underline">Expand</div>
                <div className="rotate-90">{"->"}</div>
              </>
            )}
          </Button>
        </div>
      )}

      <div className="flex max-w-full flex-row gap-2">
        {pools && showClaimAllYield && pools.length > 0 && (
          <div className="flex flex-1 flex-col items-center">
            <Button
              className="w-full text-3xs text-black md:text-xs"
              variant={collectError ? "destructive" : "iridescent"}
              disabled={!!collectData || isCollectPending}
              size="sm"
              onClick={() => collectAll()}
            >
              {collectError
                ? "Failed"
                : collectData
                  ? "Claimed!"
                  : isCollectPending
                    ? "Claiming..."
                    : "Claim All Yield"}
            </Button>
            <Badge
              variant={collectError ? "destructive" : "iridescent"}
              className="-mt-2 gap-2 border-2 border-black text-3xs"
            >
              {unclaimedRewards}
            </Badge>
          </div>
        )}
        <Link href={"/stake/pool/create"} className="flex-1">
          <Button
            className="w-full text-3xs md:text-xs"
            variant="secondary"
            size="sm"
          >
            + Create New Position
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};
