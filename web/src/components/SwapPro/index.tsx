"use client";

import { output as seawaterContract } from "@/lib/abi/ISeawaterAMM";
import { useSwapPro } from "@/stores/useSwapPro";
import { TypographyH3 } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Token from "@/assets/icons/token.svg";
import Ethereum from "@/assets/icons/ethereum.svg";
import { useWelcomeStore } from "@/stores/useWelcomeStore";
import { cn } from "@/lib/utils";
import { Graph } from "@/components/SwapPro/SwapProGraph";
import { useSwapStore } from "@/stores/useSwapStore";
import { columns, Transaction } from "@/app/_DataTable/columns";
import { DataTable } from "@/app/_DataTable/DataTable";
import { useGraphqlGlobal } from "@/hooks/useGraphql";
import { useFragment } from "@/gql";
import { SwapProPoolFragment } from "@/components/SwapPro/SwapProPoolFragment";
import { useMemo } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { usdFormat } from "@/lib/usdFormat";
import { useConnectorClient, useSimulateContract } from "wagmi";
import { ammAddress } from "@/lib/addresses";
import { sqrtPriceX96ToPrice } from "@/lib/math";
import { fUSDC } from "@/config/tokens";

const variants = {
  hidden: { opacity: 0, width: 0 },
  visible: { opacity: 1, width: "auto" },
};

export const SwapPro = ({
  override,
  badgeTitle,
}: {
  override?: boolean;
  badgeTitle?: boolean;
}) => {
  const swapPro = useSwapPro((s) => s.swapPro);
  const welcome = useWelcomeStore((s) => s.welcome);

  const { isLtSm } = useMediaQuery();

  const { token0, token1 } = useSwapStore();

  const isOpen = override || (!welcome && (swapPro || isLtSm));

  const { data: dataGlobal, isLoading: isLoadingGlobal } = useGraphqlGlobal();

  const isLoading = isLoadingGlobal;

  // the selected pool
  const pool = useMemo(
    () =>
      dataGlobal?.pools?.find(
        (pool) =>
          pool.address.toLowerCase() === token0.address.toLowerCase() ||
          pool.address.toLowerCase() === token1.address.toLowerCase(),
      ),
    [dataGlobal?.pools, token0.address, token1.address],
  );

  const poolSwapPro = useFragment(SwapProPoolFragment, pool);

  const volume24H = useMemo(() => {
    const [
      { fusdc: { valueUsd: fusdcValue }, token1: { valueUsd: token1Value } } = {
        fusdc: { valueUsd: "0" },
        token1: { valueUsd: "0" },
      },
    ] = poolSwapPro?.volumeOverTime.daily || [];
    return usdFormat(parseFloat(fusdcValue) + parseFloat(token1Value));
  }, [poolSwapPro]);

  const poolBalance = useMemo(
    () =>
      usdFormat(
        poolSwapPro
          ? poolSwapPro.liquidity.reduce(
              (total, { liquidity }) => total + parseFloat(liquidity),
              0,
            )
          : 0,
      ),
    [poolSwapPro],
  );

  // useSimulateContract throws if connector.account is not defined
  // so we must check if it exists or use a dummy address for sqrtPriceX96 and quote/quote2
  const { data: connector } = useConnectorClient();
  const simulateAccount =
    connector?.account ?? "0x1111111111111111111111111111111111111111";

  const { data: token0SqrtPriceX96 } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    account: simulateAccount,
    functionName: "sqrtPriceX967B8F5FC5",
    args: [token0.address],
  });

  const { data: token1SqrtPriceX96 } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    account: simulateAccount,
    functionName: "sqrtPriceX967B8F5FC5",
    args: [token1.address],
  });

  const formattedTokenPrice = useMemo(() => {
    const token0Price = token0SqrtPriceX96
      ? Number(
          sqrtPriceX96ToPrice(token0SqrtPriceX96.result, token0.decimals),
        ) /
        10 ** fUSDC.decimals
      : 0;
    const token1Price = token1SqrtPriceX96
      ? Number(
          sqrtPriceX96ToPrice(token1SqrtPriceX96.result, token1.decimals),
        ) /
        10 ** fUSDC.decimals
      : 0;

    switch (fUSDC.address) {
      case token0.address:
        return usdFormat(token1Price);
      case token1.address:
        return usdFormat(token0Price);
      default:
        return `${usdFormat(token0Price)}/${usdFormat(token1Price)}`;
    }
  }, [token0, token1, token0SqrtPriceX96, token1SqrtPriceX96]);

  const transactions = poolSwapPro?.swaps.swaps;

  const showMockData = useFeatureFlag("ui show demo data");
  const showStakeApy = useFeatureFlag("ui show stake apy");
  const showMyTransactions = useFeatureFlag("ui show my transactions");
  const showTradeRewards = useFeatureFlag("ui show trade rewards");

  const transactionData = useMemo((): Transaction[] | undefined => {
    if (showMockData)
      return [
        {
          id: "1",
          value: 100,
          rewards: 200,
          time: new Date("2023-10-10T14:48:00.000+09:00"),
          amountFrom: 30.2,
          amountTo: 0.0001,
        },
        {
          id: "2",
          value: 300,
          rewards: 20,
          time: new Date("2023-10-10T16:32:00.000+09:00"),
          amountFrom: 30.2,
          amountTo: 0.0001,
        },
      ] as Transaction[];

    return transactions
      ?.map((transaction) => {
        return {
          id: transaction.timestamp.toString(),
          value: parseFloat(transaction.amountIn.valueScaled),
          rewards: 0,
          time: new Date(transaction.timestamp * 1000),
          amountFrom: parseFloat(transaction.amountIn.valueScaled),
          amountTo: parseFloat(transaction.amountOut.valueScaled),
          transactionHash: transaction.transactionHash,
        };
      })
      .sort((a, b) => (a.time > b.time ? -1 : a.time === b.time ? 0 : 1));
  }, [transactions, showMockData]);

  return (
    <motion.div
      initial={"hidden"}
      variants={variants}
      animate={isOpen ? "visible" : "hidden"}
      className={cn("z-10 flex flex-col items-center justify-center", {
        hidden: !isOpen,
      })}
      transition={{
        type: "spring",
        bounce: 0.5,
        duration: 0.5,
        opacity: { ease: "linear", duration: 0.2 },
      }}
    >
      <div
        className={
          "flex w-full flex-col gap-4 overflow-x-clip p-4 pl-8 sm:w-[500px] md:mr-10 md:w-[500px] lg:w-[500px] xl:w-[600px]"
        }
      >
        {badgeTitle ? (
          <div className="flex flex-row items-center">
            <Ethereum className={"size-[30px]"} />
            <Badge className="z-50 -ml-2 pl-1">
              <div className="flex flex-row items-center gap-1">
                <Token className={"size-[28px] invert"} />
                <div className="text-xl">
                  {token0.symbol} - {token1.symbol}
                </div>
              </div>
            </Badge>
          </div>
        ) : (
          <TypographyH3 className="hidden font-normal md:inline-flex">
            {token0.symbol}/{token1.symbol}
          </TypographyH3>
        )}

        {poolSwapPro && (
          <Graph pool={poolSwapPro} currentPrice={formattedTokenPrice} />
        )}

        <div className="hidden w-full flex-row flex-wrap items-center justify-between gap-2 md:flex">
          <div>
            <p className="text-2xs">Liquidity</p>
            <p className="text-xl">{poolBalance}</p>
          </div>

          <div>
            <p className="text-2xs">Volume 24H</p>
            <p className="text-xl">{volume24H}</p>
          </div>

          <div>
            <p className="text-2xs">Stake APY</p>
            <p className="text-xl">{showStakeApy ? "1.62%" : "-"}</p>
          </div>

          <div>
            <p className="text-2xs">24H Trade Rewards</p>
            <p className="text-xl">{showTradeRewards ? "$300.56" : "-"}</p>
          </div>
        </div>

        <div className="mt-[35px]">
          <div className="flex w-full flex-row items-center justify-between">
            <h3 className="text-sm">Transaction History</h3>
            {showMyTransactions && (
              <div>
                <span className="cursor-pointer text-sm underline">
                  My Transactions
                </span>{" "}
                {"->"}
              </div>
            )}
          </div>
        </div>

        {transactionData && (
          <DataTable columns={columns} data={transactionData} />
        )}
      </div>
    </motion.div>
  );
};
