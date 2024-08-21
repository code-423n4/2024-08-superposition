"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStakeStore } from "@/stores/useStakeStore";
import TokenIridescent from "@/assets/icons/token-iridescent.svg";
import { motion } from "framer-motion";
import {
  useAccount,
  useChainId,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { output as seawaterContract } from "@/lib/abi/ISeawaterAMM";
import {
  sqrtPriceX96ToPrice,
  getLiquidityForAmounts,
  snapTickToSpacing,
} from "@/lib/math";
import { useEffect, useCallback, useMemo } from "react";
import { erc20Abi, Hash, hexToBigInt, maxUint256 } from "viem";
import { ammAddress } from "@/lib/addresses";
import LightweightERC20 from "@/lib/abi/LightweightERC20";
import Confirm from "@/components/sequence/Confirm";
import { EnableSpending } from "@/components/sequence/EnableSpending";
import { Fail } from "@/components/sequence/Fail";
import { Success } from "@/components/sequence/Success";
import {
  getFormattedPriceFromAmount,
  getUsdTokenAmountsForPosition,
} from "@/lib/amounts";
import { fUSDC } from "@/config/tokens";
import { TokenIcon } from "./TokenIcon";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { usePositions } from "@/hooks/usePostions";

type ConfirmStakeProps =
  | {
      mode: "new";
      positionId?: never;
    }
  | {
      mode: "existing";
      positionId: number;
    };

export const ConfirmStake = ({ mode, positionId }: ConfirmStakeProps) => {
  const router = useRouter();

  const { address, chainId } = useAccount();
  const expectedChainId = useChainId();
  const showBoostIncentives = useFeatureFlag("ui show boost incentives");
  const showStakeApy = useFeatureFlag("ui show stake apy");

  useEffect(() => {
    if (!address || chainId !== expectedChainId) router.back();
  }, [address, expectedChainId, chainId]);

  const {
    token0,
    token1,
    token0Amount,
    token0AmountRaw,
    token1Amount,
    token1AmountRaw,
    tickLower,
    tickUpper,
    multiSingleToken,
    feePercentage,
  } = useStakeStore();

  const { positions, updatePositionLocal } = usePositions();

  // Price of the current pool
  const { data: poolSqrtPriceX96 } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "sqrtPriceX967B8F5FC5",
    args: [token0.address],
  });

  const tokenPrice = poolSqrtPriceX96
    ? sqrtPriceX96ToPrice(poolSqrtPriceX96.result, token0.decimals)
    : 0n;

  // if no token or no token amount redirect to the stake form
  useEffect(() => {
    if (token0 && token0Amount) return;

    router.push("/stake/pool/create");
  }, [router, token0, token0Amount]);

  // read the allowance of the token
  const { data: allowanceDataToken0 } = useSimulateContract({
    address: token0.address,
    abi: LightweightERC20,
    // @ts-ignore this needs to use useSimulateContract which breaks the types
    functionName: "allowance",
    // @ts-ignore
    args: [address as Hash, ammAddress],
  });

  const { data: allowanceDataToken1 } = useSimulateContract({
    address: token1.address,
    abi: LightweightERC20,
    // @ts-ignore this needs to use useSimulateContract which breaks the types
    functionName: "allowance",
    // @ts-ignore
    args: [address as Hash, ammAddress],
  });

  // Current tick of the pool
  const { data: curTickNum } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "curTick181C6FD9",
    args: [token0.address],
  });
  const curTick = { result: BigInt(curTickNum?.result ?? 0) };

  const { data: tickSpacing } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "tickSpacing653FE28F",
    args: [token0.address],
  });

  // set up write contract hooks
  const {
    writeContract: writeContractMint,
    data: mintData,
    error: mintError,
    isPending: isMintPending,
  } = useWriteContract();
  const {
    writeContract: writeContractApprovalToken0,
    data: approvalDataToken0,
    error: approvalErrorToken0,
    isPending: isApprovalPendingToken0,
    reset: resetApproveToken0,
  } = useWriteContract();
  const {
    writeContract: writeContractApprovalToken1,
    data: approvalDataToken1,
    error: approvalErrorToken1,
    isPending: isApprovalPendingToken1,
    reset: resetApproveToken1,
  } = useWriteContract();
  const {
    writeContract: writeContractUpdatePosition,
    data: updatePositionData,
    error: updatePositionError,
    isPending: isUpdatePositionPending,
    reset: resetUpdatePosition,
  } = useWriteContract();

  const delta = useMemo(
    () =>
      !curTick || tickLower === undefined || tickUpper === undefined
        ? 0n
        : getLiquidityForAmounts(
            curTick.result,
            BigInt(tickLower),
            BigInt(tickUpper),
            BigInt(token0AmountRaw),
            BigInt(token1AmountRaw),
          ),
    [curTick, tickLower, tickUpper, token0AmountRaw, token1AmountRaw],
  );

  /**
   * Create a new position in the AMM.
   *
   * Step 1. Mint a new position
   */
  const createPosition = () => {
    if (
      tickLower === undefined ||
      tickUpper === undefined ||
      tickLower >= tickUpper ||
      !tickSpacing
    )
      return;

    const { result: spacing } = tickSpacing;

    // snap ticks to spacing
    const lower = snapTickToSpacing(tickLower, spacing);
    const upper = snapTickToSpacing(tickUpper, spacing);

    writeContractMint({
      address: ammAddress,
      abi: seawaterContract.abi,
      functionName: "mintPositionBC5B086D",
      args: [token0.address, lower, upper],
    });
  };

  const usdTokenOPrice = getFormattedPriceFromAmount(
    token0Amount,
    tokenPrice,
    fUSDC.decimals,
  );

  const usdTokenOPriceWReward =
    getFormattedPriceFromAmount(token0Amount, tokenPrice, fUSDC.decimals) +
    Number(token1Amount);

  // wait for the mintPosition transaction to complete
  const result = useWaitForTransactionReceipt({
    hash: mintData,
  });

  // extract the position ID from the mintPosition transaction
  const mintPositionId = result?.data?.logs[0].topics[1];

  const updatePosition = useCallback(
    (id: bigint) => {
      writeContractUpdatePosition({
        address: ammAddress,
        abi: seawaterContract.abi,
        functionName: "updatePositionC7F1F740",
        args: [token0.address, id, delta],
      });
    },
    [writeContractUpdatePosition, delta, token0],
  );

  /**
   * Approve the AMM to spend the token
   *
   * Step 3. Approve token 1
   */
  const approveToken1 = useCallback(() => {
    if (
      !allowanceDataToken1?.result ||
      allowanceDataToken1.result < BigInt(token1AmountRaw)
    ) {
      writeContractApprovalToken1({
        address: token1.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [ammAddress, maxUint256],
      });
    } else {
      updatePosition(hexToBigInt(mintPositionId as Hash));
    }
  }, [
    allowanceDataToken1,
    writeContractApprovalToken1,
    token1,
    updatePosition,
    mintPositionId,
  ]);

  /**
   * Step 2. Approve token 0
   */
  const approveToken0 = useCallback(() => {
    if (
      !allowanceDataToken0?.result ||
      allowanceDataToken0.result < BigInt(token1AmountRaw)
    ) {
      writeContractApprovalToken0({
        address: token0.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [ammAddress, maxUint256],
      });
    } else {
      approveToken1();
    }
  }, [allowanceDataToken0, writeContractApprovalToken0, token0, approveToken1]);

  // once we have the position ID, approve the AMM to spend the token
  useEffect(() => {
    if (!mintPositionId) return;

    approveToken0();
    // including approveToken0 in this dependency array causes changes in allowance data
    // to retrigger the staking flow, as allowance data is a dependency of approveToken0
  }, [mintPositionId]);

  // wait for the approval transaction to complete
  const approvalToken0Result = useWaitForTransactionReceipt({
    hash: approvalDataToken0,
  });

  // once approval of token 0 is complete,
  useEffect(() => {
    if (!approvalToken0Result.data || !mintPositionId) return;
    approveToken1();
    // including approveToken1 in this dependency array causes changes in allowance data
    // to retrigger the staking flow, as allowance data is a dependency of approveToken1
  }, [approvalToken0Result.data, mintPositionId]);

  const approvalToken1Result = useWaitForTransactionReceipt({
    hash: approvalDataToken1,
  });

  // update the position once the approval is complete
  useEffect(() => {
    if (!approvalToken1Result.data || !mintPositionId) return;
    updatePosition(hexToBigInt(mintPositionId as Hash));
  }, [approvalToken1Result.data, mintPositionId, updatePosition]);

  // wait for the updatePosition transaction to complete
  const updatePositionResult = useWaitForTransactionReceipt({
    hash: updatePositionData,
  });
  useEffect(() => {
    if (updatePositionResult.isSuccess) {
      const id = positionId ?? Number(mintPositionId);
      if (id && tickLower && tickUpper) {
        const position = positions.find((p) => p.positionId === id) ?? {
          positionId: id,
          pool: {
            token: token0,
          },
          lower: tickLower,
          upper: tickUpper,
        };
        getUsdTokenAmountsForPosition(
          position,
          token0,
          Number(tokenPrice),
        ).then(([amount0, amount1]) =>
          updatePositionLocal({
            ...position,
            created: Math.round(new Date().getTime() / 1000),
            served: {
              timestamp: Math.round(new Date().getTime() / 1000),
            },
            liquidity: {
              fusdc: {
                valueUsd: String(amount1),
              },
              token1: {
                valueUsd: String(amount0),
              },
            },
          }),
        );
      }
    }
  }, [updatePositionResult.isSuccess]);

  // step 1 pending
  if (isMintPending || (mintData && result?.isPending)) {
    return (
      <Confirm
        text={"Stake"}
        fromAsset={{ symbol: token0.symbol, amount: token0Amount ?? "0" }}
        toAsset={{ symbol: token1.symbol, amount: token1Amount ?? "0" }}
        transactionHash={mintData}
      />
    );
  }

  // step 2 pending
  if (
    isApprovalPendingToken0 ||
    (approvalDataToken0 && approvalToken0Result?.isPending)
  ) {
    return (
      <EnableSpending
        tokenName={token0.symbol}
        transactionHash={approvalDataToken0}
      />
    );
  }

  // step 3 pending
  if (
    isApprovalPendingToken1 ||
    (approvalDataToken1 && approvalToken1Result?.isPending)
  ) {
    return (
      <EnableSpending
        tokenName={token1.symbol}
        transactionHash={approvalDataToken1}
      />
    );
  }

  // step 3 pending
  if (
    isUpdatePositionPending ||
    (updatePositionData && updatePositionResult?.isPending)
  ) {
    return (
      <Confirm
        text={"Stake"}
        fromAsset={{ symbol: token0.symbol, amount: token0Amount ?? "0" }}
        toAsset={{ symbol: token1.symbol, amount: token1Amount ?? "0" }}
        transactionHash={updatePositionData}
      />
    );
  }

  // success
  if (updatePositionResult.data) {
    return (
      <Success
        transactionHash={updatePositionResult.data.transactionHash}
        onDone={() => {
          resetUpdatePosition();
          resetApproveToken0();
          resetApproveToken1();
          updatePositionResult.refetch();
          router.push("/stake");
        }}
      />
    );
  }

  // error
  if (
    mintError ||
    approvalErrorToken0 ||
    approvalErrorToken1 ||
    updatePositionError
  ) {
    const error =
      mintError ||
      approvalErrorToken0 ||
      approvalErrorToken1 ||
      updatePositionError;
    return <Fail text={(error as any)?.shortMessage} />;
  }

  return (
    <div className="z-10 flex flex-col items-center">
      <motion.div
        layoutId={"modal"}
        className={cn("w-[315px] rounded-lg bg-black text-white md:w-[393px]", {
          "md:h-[685px]": mode === "existing",
          "md:h-[673px]": mode === "new",
          "md:h-[770px]": multiSingleToken === "single",
          "md:h-[500px]": !showBoostIncentives,
        })}
      >
        <div className="flex flex-row items-center justify-between p-[9px]">
          <div className="p-[6px] text-3xs md:text-xs">
            {mode === "new"
              ? "Stake Confirmation"
              : "Add Liquidity Confirmation"}
          </div>
          <Button
            size="esc"
            variant={"secondary"}
            onClick={() => router.back()}
          >
            Esc
          </Button>
        </div>

        <div
          className={cn("mt-[26px] flex flex-col items-center md:mt-[30px]", {
            hidden: multiSingleToken === "single",
          })}
        >
          <div className="text-3xs md:text-2xs">
            {mode === "new"
              ? "Total Deposited Amount in"
              : "Approximate Total Deposit Amount in"}{" "}
            <span className="hidden md:inline-flex">
              {" "}
              <span className="font-medium underline">$USD</span>
            </span>
          </div>
          <div className="mt-[4px] text-2xl font-medium md:text-3xl">
            ${usdTokenOPriceWReward}
          </div>
          <div className="mt-[4px] text-3xs font-medium text-gray-2 md:text-2xs">
            The amount is split into{" "}
            <span className="text-white underline">2 Tokens</span> below:
          </div>
        </div>

        <div
          className={cn("mt-[26px] flex flex-col items-center md:mt-[30px]", {
            hidden: multiSingleToken === "multi",
          })}
        >
          <div className="text-3xs md:text-2xs">
            {mode === "new"
              ? "Total Deposited Amount in"
              : "Approximate Total Deposit Amount in"}{" "}
            <span className="hidden md:inline-flex">
              {" "}
              <span className="font-medium underline">ƒUSDC</span>
            </span>
          </div>
          <div className="mt-[4px] flex flex-row items-center gap-[6px] text-2xl font-medium md:text-3xl">
            <TokenIridescent />
            <div>700</div>
          </div>
          <div className="mt-[4px] text-3xs font-medium text-gray-2 md:text-2xs">
            (= $700)
          </div>
          <div className="mt-[19px] w-[212px] text-center text-3xs font-medium text-gray-2 md:mt-[17px] md:w-[250px] md:text-2xs">
            Your <span className="iridescent-text">700 ƒUSDC</span> will be
            converted into the following two tokens to set your position in this
            pool <div className="inline-block rotate-90">{"->"}</div>
          </div>
        </div>

        <div
          className={cn("mt-[20px] flex flex-col items-center", {
            hidden: multiSingleToken === "multi",
          })}
        >
          <div className="flex h-[156px] w-[272px] flex-col rounded-md border md:h-[199px] md:w-[349px]">
            <div className="flex flex-1 flex-row justify-between border-b pl-[18px] pr-[26px] pt-[16px]">
              <div className="flex w-full flex-col gap-1">
                <div className="text-3xs md:text-2xs">{token0.symbol}</div>
                <div className="flex  flex-row items-center justify-between">
                  <div className="flex flex-row items-center gap-1 text-sm md:gap-2 md:text-2xl">
                    <TokenIcon
                      src={token0.icon}
                      className={"size-[16px] invert"}
                    />
                    <div>{token0Amount}</div>
                  </div>
                  <div className="text-3xs text-gray-2 md:text-xs">50%</div>
                </div>
                <div className="text-3xs text-gray-2">= $350.00</div>
              </div>
            </div>

            <div className="flex flex-1 flex-row justify-between pl-[18px] pr-[26px] pt-[16px]">
              <div className="flex w-full flex-col gap-1">
                <div className="text-3xs md:text-2xs">ƒUSDC</div>
                <div className="flex  flex-row items-center justify-between">
                  <div className="flex flex-row items-center gap-1 text-sm md:gap-2 md:text-2xl">
                    <TokenIridescent />
                    <div>350.00</div>
                  </div>
                  <div className="text-3xs text-gray-2 md:text-xs">50%</div>
                </div>
                <div className="text-3xs text-gray-2">= $350.00</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn("mt-[15px] pl-[21px]", {
            hidden: multiSingleToken === "single",
          })}
        >
          <div className="text-3xs font-medium md:text-2xs">
            {token0.symbol}
          </div>
          <div className="mt-1 flex flex-row items-center gap-1 text-2xl">
            <TokenIcon src={token0.icon} className={"size-[24px] invert"} />{" "}
            {token0Amount}
          </div>
          <div className="mt-0.5 text-2xs text-gray-2 md:text-xs">
            = ${usdTokenOPrice}
          </div>
        </div>

        <div
          className={cn("mt-[23px] pl-[21px]", {
            hidden: multiSingleToken === "single",
          })}
        >
          <div className="text-3xs font-medium md:text-2xs">ƒUSDC</div>
          <div className="mt-1 flex flex-row items-center gap-1 text-2xl">
            <TokenIcon src={token1.icon} className={"size-[24px] invert"} />{" "}
            {token1Amount}
          </div>
          <div className="mt-0.5 text-2xs text-gray-2 md:text-xs">
            = ${token1Amount}
          </div>
        </div>

        <div
          className={cn(
            "mt-[21px] flex flex-row justify-between px-[21px] text-3xs font-medium md:text-2xs md:font-normal",
            {
              hidden: mode === "new",
            },
          )}
        >
          <div>Expected Shares</div>
          <div>0.000321568910</div>
        </div>
        <div
          className={cn("px-[21px]", {
            "mt-[29px] md:mt-[37px]": mode === "new",
            "mt-[19px] md:mt-[16px]": mode === "existing",
          })}
        >
          <div className="text-3xs font-medium md:text-2xs md:font-normal">
            Projected Yield
          </div>
          <div className="mt-[13px] flex flex-col gap-[5px] px-[4px] text-2xs">
            <div className="flex flex-row justify-between">
              <div>Fees</div>
              <div>
                Pool Fee {+feePercentage.toFixed(6)}% ={" "}
                {+(usdTokenOPrice * feePercentage).toFixed(6)}$
              </div>
            </div>

            {showBoostIncentives && (
              <>
                <div className="flex flex-row justify-between">
                  <div>Protocol Boosts</div>
                  <div>3.5%</div>
                </div>

                <div className="flex flex-row justify-between">
                  <div>Super Boosts</div>
                  <div>2%</div>
                </div>
              </>
            )}

            {showStakeApy && (
              <>
                <div className="mt-[15px] flex flex-row justify-between">
                  <div>APY</div>
                  <div className="iridescent rounded px-1 text-black">
                    12.09%
                  </div>
                </div>

                <div className="flex flex-row justify-between">
                  <div>Yield</div>
                  <div>$247.88</div>
                </div>
              </>
            )}
          </div>
        </div>

        {showBoostIncentives && (
          <>
            <div className="mt-[20px] px-[21px]">
              <div className="text-3xs">Yield Composition</div>

              <div className="mt-[20px] flex flex-row gap-1 text-2xs">
                <div className="flex w-[3%] flex-col gap-1">
                  <div>3%</div>
                  <div className="h-1 w-full rounded bg-white"></div>
                  <div className="text-4xs md:hidden">Fees</div>
                </div>

                <div className="flex w-[7%] flex-col items-center gap-1">
                  <div>7%</div>
                  <div className="h-1 w-full rounded bg-white"></div>
                  <div className="text-4xs md:hidden">Protocol Boosts</div>
                </div>

                <div className="flex w-[30%] flex-col items-center gap-1">
                  <div>30%</div>
                  <div className="h-1 w-full rounded bg-white"></div>
                  <div className="text-4xs md:text-3xs">Super Boosts</div>
                </div>

                <div className="flex w-3/5 flex-col items-center gap-1">
                  <div>60%</div>
                  <div className="iridescent h-1 w-full rounded"></div>
                  <div className="text-4xs md:text-3xs">Utility Boosts</div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className=" flex flex-col items-center p-[15px]">
          <Button
            variant={"secondary"}
            className="w-full max-w-[350px]"
            onClick={() => {
              mode === "new"
                ? createPosition()
                : updatePosition(BigInt(positionId));
            }}
          >
            Confirm Stake
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
