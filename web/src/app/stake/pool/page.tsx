"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { SwapPro } from "@/components/SwapPro";
import { useHotkeys } from "react-hotkeys-hook";
import Token from "@/assets/icons/token.svg";
import { Badge } from "@/components/ui/badge";
import { Line } from "rc-progress";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import ReactECharts from "echarts-for-react";
import Link from "next/link";
import { output as seawaterContract } from "@/lib/abi/ISeawaterAMM";
import { useCallback, useEffect, useMemo, useState } from "react";
import { graphql, useFragment } from "@/gql";
import { useGraphqlGlobal } from "@/hooks/useGraphql";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { usdFormat } from "@/lib/usdFormat";
import { fUSDC, getTokenFromAddress } from "@/config/tokens";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFormattedPriceFromTick } from "@/lib/amounts";
import { useStakeStore } from "@/stores/useStakeStore";
import { useSwapStore } from "@/stores/useSwapStore";
import { ammAddress } from "@/lib/addresses";
import { useSimulateContract, useWriteContract } from "wagmi";
import {
  getSqrtRatioAtTick,
  getTokenAmountsNumeric,
  sqrtPriceX96ToPrice,
} from "@/lib/math";
import { TokenIcon } from "@/components/TokenIcon";
import { usePositions } from "@/hooks/usePostions";

const ManagePoolFragment = graphql(`
  fragment ManagePoolFragment on SeawaterPool {
    address
    id
    liquidity {
      liquidity
    }
    token {
      symbol
      name
      decimals
    }
    earnedFeesAPRFUSDC
  }
`);

export default function PoolPage() {
  const router = useRouter();

  useHotkeys("esc", () => router.back());

  // get the id from the query params
  const params = useSearchParams();
  const id = params.get("id");
  const positionIdParam = Number(params.get("positionId"));

  const { data: globalData } = useGraphqlGlobal();
  const allPoolsData = useFragment(ManagePoolFragment, globalData?.pools);
  const { positions: positionsData_ } = usePositions();
  const positionsData = useMemo(
    () =>
      positionsData_.filter(
        (p) =>
          p.pool.token.address === id &&
          parseFloat(p.liquidity.fusdc.valueUsd) +
            parseFloat(p.liquidity.token1.valueUsd) >
            0,
      ),
    [id, positionsData_],
  );

  const { token0, token1, setToken0, setToken1 } = useStakeStore();

  const { setToken0: setToken0Swap, setToken1: setToken1Swap } = useSwapStore();

  useEffect(() => {
    if (!id) return;
    const token = getTokenFromAddress(id);
    if (!token) return;
    // Graph is rendered by SwapPro, which uses the swap store
    // So we have to set both of these.
    setToken0(token);
    setToken1(fUSDC);
    setToken0Swap(token);
    setToken1Swap(fUSDC);
  }, [id]);

  const poolData = allPoolsData?.find((pool) => pool.id === id);

  const setPositionId = (posId: number) =>
    router.replace(`?id=${id}&positionId=${posId}`);

  // position is the currently selected position based on
  // the query parameters
  const position = useMemo(() => {
    if (positionIdParam)
      return positionsData?.find((p) => p.positionId === positionIdParam);
    return positionsData?.[0];
  }, [positionIdParam]);

  const { positionId, upper: upperTick, lower: lowerTick } = position || {};

  const poolBalance = useMemo(
    () =>
      usdFormat(
        positionsData
          ? positionsData.reduce(
              (total, { liquidity: { fusdc, token1 } }) =>
                total +
                parseFloat(fusdc.valueUsd) +
                parseFloat(token1.valueUsd),
              0,
            )
          : 0,
      ),
    [poolData],
  );

  // Current liquidity of the position
  const { data: positionLiquidity } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "positionLiquidity8D11C045",
    args: [token0.address, BigInt(positionId ?? 0)],
  });

  // Current tick of the pool
  const { data: { result: curTickNum } = { result: 0 } } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "curTick181C6FD9",
    args: [token0.address],
  });
  const curTick = BigInt(curTickNum);

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

  const { data: unclaimedRewardsData } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "collect7F21947C",
    args: [[token0.address], [BigInt(positionId ?? 0)]],
  });

  const unclaimedRewards = useMemo(() => {
    if (!unclaimedRewardsData || !positionId) return "$0.00";

    const [{ amount0, amount1 }] = unclaimedRewardsData.result || [
      { amount0: 0n, amount1: 0n },
    ];
    const token0AmountScaled =
      (Number(amount0) * Number(tokenPrice)) /
      10 ** (token0.decimals + fUSDC.decimals);
    const token1AmountScaled = Number(amount1) / 10 ** fUSDC.decimals;
    return usdFormat(token0AmountScaled + token1AmountScaled);
  }, [unclaimedRewardsData]);

  const collect = useCallback(
    (id: bigint) => {
      writeContractCollect({
        address: ammAddress,
        abi: seawaterContract.abi,
        functionName: "collect7F21947C",
        args: [[token0.address], [id]],
      });
    },
    [writeContractCollect, token0],
  );

  const positionBalance = useMemo(() => {
    if (!positionLiquidity || !position) return 0;
    const [amount0, amount1] = getTokenAmountsNumeric(
      Number(positionLiquidity.result),
      Number(getSqrtRatioAtTick(curTick)),
      position.lower,
      position.upper,
    );
    return usdFormat(
      (amount0 * Number(tokenPrice)) /
        10 ** (token0.decimals + fUSDC.decimals) +
        amount1 / 10 ** token1.decimals,
    );
  }, [position, positionLiquidity, tokenPrice, token0, token1, curTick]);

  const showMockData = useFeatureFlag("ui show demo data");
  const showBoostIncentives = useFeatureFlag("ui show boost incentives");
  const showUtilityIncentives = useFeatureFlag("ui show utility incentives");
  const showLiquidityIncentives = useFeatureFlag(
    "ui show liquidity incentives",
  );
  const showSuperIncentives = useFeatureFlag("ui show super incentives");
  const showLiveUtilityRewards = useFeatureFlag("ui show live utility rewards");
  const showTokensGivenOut = useFeatureFlag("ui show tokens given out");
  const showClaimYield = useFeatureFlag("ui show claim yield");
  const showPoolRewardRange = useFeatureFlag("ui show pool reward range");
  const showEarnedFeesApr = useFeatureFlag("ui show earned fees apr");

  /**
   * Redirect to the stake page if the id is not present
   */
  useEffect(() => {
    if (!id) router.push("/stake");
  }, [router, id]);

  // if the id is not present, return null
  // will be handled by the useEffect above
  if (!id) return null;

  // if we aren't showing mock data and we don't have pool data, return null
  // this should only be the case when the data is initially loading, or an invalid id is passed
  // TODO: provide feedback for invalid IDs
  if (!showMockData && !poolData) return null;

  const superIncentives = 0;

  const liquidityCampaignsApy = 0;

  return (
    <div className="flex w-full flex-col">
      <div className="flex max-w-full flex-col-reverse justify-center gap-8 lg:flex-row">
        <div className="flex flex-col items-center">
          <SwapPro override badgeTitle />
        </div>

        <div className="flex flex-col items-center">
          <div className="z-10 flex w-full flex-col items-center px-4">
            <motion.div
              layoutId="modal"
              className="flex w-[19.8125rem] flex-col rounded-lg bg-black p-2 pt-0 text-white md:w-[393px]"
            >
              <div className="flex flex-row items-center justify-between">
                <div className="p-4 text-2xs">Manage Pool</div>
                <Button
                  variant="secondary"
                  className="h-[26px] w-12 px-[9px] py-[7px] text-2xs"
                  onClick={() => router.back()}
                >
                  {"<-"} Esc
                </Button>
              </div>

              <div className="mt-px flex flex-row items-center justify-between px-4">
                <div className="flex flex-row items-center">
                  <TokenIcon
                    src={token0.icon}
                    className={"size-[24px] invert"}
                  />
                  <Badge className="iridescent z-20 -ml-1 flex flex-row gap-2 border-4 border-black pl-1 text-black">
                    <Token className={"size-[24px]"} />
                    <div className="text-nowrap text-sm">
                      fUSDC-{showMockData ? "ETH" : poolData?.token?.symbol}
                    </div>
                  </Badge>
                </div>

                {showLiveUtilityRewards && (
                  <div className="flex flex-col items-end gap-1">
                    <Badge className="iridescent flex h-4 w-[93px] flex-row pl-0.5 text-black md:w-[132px]">
                      <div className="flex flex-row">
                        <Token className={"size-[14px]"} />
                        <Token className={"ml-[-5px] size-[14px]"} />
                        <Token className={"ml-[-5px] size-[14px]"} />
                      </div>
                      <div className="text-nowrap text-4xs font-medium md:text-2xs">
                        Live Utility Rewards
                      </div>
                    </Badge>

                    <p className="text-3xs">5days | 24hrs | 30min</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-8 p-4">
                <div className="flex flex-row gap-2">
                  {!position ? (
                    <Link href={`/stake/pool/create?id=${id}`} legacyBehavior>
                      <Button
                        variant="secondary"
                        className="flex-1 text-3xs md:text-2xs"
                        size="sm"
                      >
                        + Create New Position
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={`/stake/pool/add-liquidity?id=${id}&positionId=${positionId}`}
                        legacyBehavior
                      >
                        <Button
                          variant="secondary"
                          className="flex-1 text-3xs md:text-2xs"
                          size="sm"
                        >
                          + Add Liquidity
                        </Button>
                      </Link>
                      <Link
                        href={`/stake/pool/withdraw-liquidity?positionId=${positionId}`}
                        legacyBehavior
                      >
                        <Button
                          variant="secondary"
                          className="flex-1 text-3xs md:text-2xs"
                          size="sm"
                        >
                          - Withdraw Liquidity
                        </Button>
                      </Link>
                    </>
                  )}
                </div>

                <div className="flex flex-row gap-2">
                  <div className="flex flex-1 flex-col">
                    <div className="text-3xs md:text-2xs">My Pool Balance</div>
                    <div className="text-xl md:text-2xl">
                      {/* TODO: get my pool balance */}
                      {showMockData ? "$190,301" : poolBalance}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="text-nowrap text-3xs md:text-2xs">
                      Unclaimed Rewards
                    </div>
                    <div className="text-xl md:text-2xl">
                      {/* TODO:get unclaimed rewards */}
                      {showMockData ? "$52,420" : unclaimedRewards}
                    </div>
                  </div>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="flex flex-1 flex-col">
                    <div className="text-3xs md:text-2xs">
                      Current Position Range
                    </div>
                    <div className="text-xl md:text-2xl">
                      {lowerTick
                        ? getFormattedPriceFromTick(
                            lowerTick,
                            token0.decimals,
                            token1.decimals,
                          )
                        : usdFormat(0)}
                      -
                      {upperTick
                        ? getFormattedPriceFromTick(
                            upperTick,
                            token0.decimals,
                            token1.decimals,
                          )
                        : usdFormat(0)}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="text-3xs md:text-2xs">
                      Current Position Balance
                    </div>
                    <div className="text-xl md:text-2xl">{positionBalance}</div>
                  </div>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="flex flex-1 flex-col">
                    <div className="text-3xs md:text-2xs">Select Position</div>
                    <Select
                      value={`${positionId}`}
                      onValueChange={(value) => setPositionId(Number(value))}
                      defaultValue={`${position?.positionId}`}
                    >
                      <SelectTrigger className="h-6 w-auto border-0 bg-black p-0 text-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {positionsData?.map((position) => (
                          <SelectItem
                            key={`${position.positionId}`}
                            value={`${position.positionId}`}
                          >
                            {position.positionId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-[7px]">
                  {showPoolRewardRange && (
                    <div className="flex flex-row justify-between">
                      <div className="text-xs">Pool Reward Range</div>

                      <div className="text-xs">
                        {/* TODO: get pool reward range */}
                        {showMockData ? 40 : 0}% ~{" "}
                        <span className="font-bold">
                          {showMockData ? 100 : 0}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-2">
                    {showEarnedFeesApr && (
                      <div className="flex flex-row justify-between text-2xs">
                        <div>Earned Fees APR</div>

                        <div className="flex flex-row items-center gap-2">
                          <Token size="small" />
                          <div>
                            {/* TODO: this data is not a range */}
                            {showMockData ? 1 : poolData?.earnedFeesAPRFUSDC}% ~{" "}
                            {showMockData ? 5 : poolData?.earnedFeesAPRFUSDC}%
                          </div>
                        </div>
                      </div>
                    )}

                    {showLiquidityIncentives && (
                      <div className="flex flex-row justify-between text-2xs">
                        <div>Liquidity Incentives</div>

                        <div className="flex flex-row items-center gap-2">
                          <Token size="small" />
                          <div className="z-20 -ml-3">
                            <Token size="small" />
                          </div>
                          <div>
                            {/* TODO: is the liquidity incentives value a percentage? data is not a range */}
                            {showMockData ? 15 : 0}% ~ {showMockData ? 25 : ""}%
                          </div>
                        </div>
                      </div>
                    )}

                    {showSuperIncentives && (
                      <div className="flex flex-row justify-between text-2xs">
                        <div>Super Incentives</div>

                        <div className="flex flex-row items-center gap-2">
                          <Token size="small" />
                          <div>
                            {showMockData ? 20 : superIncentives}% ~{" "}
                            {showMockData ? 30 : superIncentives}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {showUtilityIncentives && (
                    <div className="flex flex-row justify-between text-2xs">
                      <div>Utility Incentives</div>

                      <div className="flex flex-row items-center gap-2">
                        <Token size="small" />
                        <div>
                          {/* TODO: get utility incentives percentage range */}
                          {showMockData ? 20 : 0}% ~ {showMockData ? 30 : 0}%
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-row items-center justify-start gap-[10px] text-sm">
                    <div className="mt-[6px] h-[25px] w-0.5 bg-white" />

                    {showTokensGivenOut && (
                      <div className="flex flex-col gap-1">
                        <div className="text-3xs">
                          {showMockData ? 200 : 0}/{showMockData ? "1,000" : 0}{" "}
                          tokens given out
                        </div>
                        <Line
                          percent={showMockData ? 20 : 0}
                          strokeColor="#EBEBEB"
                          strokeWidth={4}
                          className="rounded-full border border-white"
                          trailWidth={0}
                          trailColor="#1E1E1E"
                        />
                      </div>
                    )}

                    <div className="flex flex-1" />
                    {showClaimYield && (
                      <div>
                        <Button
                          variant={collectError ? "destructive" : "secondary"}
                          className="h-[19px] w-[75px] px-[27px] py-[5px] md:h-[22px] md:w-[92px]"
                          size="sm"
                          disabled={!!collectData || isCollectPending}
                          onClick={() =>
                            positionId && collect(BigInt(positionId))
                          }
                        >
                          <div className="text-3xs">
                            {collectError
                              ? "Failed"
                              : collectData
                                ? "Claimed!"
                                : isCollectPending
                                  ? "Claiming..."
                                  : "Claim Yield"}
                          </div>
                        </Button>
                      </div>
                    )}

                    {showBoostIncentives && (
                      <div>
                        <Button
                          variant="secondary"
                          className="iridescent h-[19.24px] w-[102.15px] px-4 py-0.5 md:px-8 md:text-base"
                          size="sm"
                        >
                          <div className="text-2xs ">Boost Incentives</div>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
