"use client";

import { Button } from "@/components/ui/button";
import { redirect, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSwapStore } from "@/stores/useSwapStore";
import { motion } from "framer-motion";
import {
  useAccount,
  useChainId,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { output as seawaterContract } from "@/lib/abi/ISeawaterAMM";
import { sqrtPriceX96ToPrice } from "@/lib/math";
import { useEffect, useCallback, useMemo } from "react";
import { erc20Abi, formatEther, Hash, maxUint256 } from "viem";
import { ammAddress } from "@/lib/addresses";
import LightweightERC20 from "@/lib/abi/LightweightERC20";
import Confirm from "@/components/sequence/Confirm";
import { EnableSpending } from "@/components/sequence/EnableSpending";
import { Fail } from "@/components/sequence/Fail";
import { Success } from "@/components/sequence/Success";
import {
  getFormattedPriceFromAmount,
  snapAmountToDecimals,
} from "@/lib/amounts";
import { fUSDC } from "@/config/tokens";
import { RewardsBreakdown } from "./RewardsBreakdown";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { TokenIcon } from "./TokenIcon";
import Gas from "@/assets/icons/gas.svg";

export const ConfirmSwap = () => {
  const router = useRouter();

  const showSwapBreakdown = useFeatureFlag("ui show swap breakdown");

  const { address, chainId } = useAccount();
  const expectedChainId = useChainId();

  const {
    token0,
    token1,
    token0Amount,
    setToken0Amount,
    token0AmountRaw,
    token1Amount,
    setToken1Amount,
    gas,
    feePercentage,
  } = useSwapStore();

  if (!address || chainId !== expectedChainId || !(token0 && token0Amount))
    redirect("/");

  // price of the current pool
  const { data: token0SqrtPriceX96 } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "sqrtPriceX967B8F5FC5",
    args: [token0.address],
  });

  const { data: token1SqrtPriceX96 } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "sqrtPriceX967B8F5FC5",
    args: [token1.address],
  });

  // the user is currently swapping the "base" asset, the fUSDC
  // asset, into the other.
  const isSwappingBaseAsset = token0.address === fUSDC.address;
  const isSwap1 = isSwappingBaseAsset || token1.address === fUSDC.address;

  const swapOptions = useMemo(() => {
    if (isSwappingBaseAsset) {
      // if one of the assets is fusdc, use swap1
      return {
        address: ammAddress,
        abi: seawaterContract.abi,
        functionName: "swap904369BE",
        args: [token1.address, false, BigInt(token0AmountRaw ?? 0), maxUint256],
      } as const;
    } else if (token1.address === fUSDC.address) {
      return {
        address: ammAddress,
        abi: seawaterContract.abi,
        functionName: "swap904369BE",
        args: [token0.address, true, BigInt(token0AmountRaw ?? 0), maxUint256],
      } as const;
    } else {
      // if both of the assets aren't fusdc, use swap2
      return {
        address: ammAddress,
        abi: seawaterContract.abi,
        functionName: "swap2ExactIn41203F1D",
        args: [
          token0.address,
          token1.address,
          BigInt(token0AmountRaw ?? 0),
          BigInt(0),
        ],
      } as const;
    }
  }, [isSwappingBaseAsset, token0AmountRaw, token0.address, token1.address]);

  // set up write hooks
  const {
    writeContract: writeContractApproval,
    data: approvalData,
    error: approvalError,
    isPending: isApprovalPending,
    reset: resetApproval,
  } = useWriteContract();
  const {
    writeContract: writeContractSwap,
    data: swapData,
    error: swapError,
    isPending: isSwapPending,
    reset: resetSwap,
  } = useWriteContract();

  const token0Price = token0SqrtPriceX96
    ? sqrtPriceX96ToPrice(token0SqrtPriceX96.result, token0.decimals)
    : 0n;

  const token1Price = token1SqrtPriceX96
    ? sqrtPriceX96ToPrice(token1SqrtPriceX96.result, token1.decimals)
    : 0n;

  const [token0AmountFloat, token1AmountFloat] = useMemo(() => {
    const token1Float = parseFloat(token1Amount ?? "0");
    if (token0Amount === "." || token0Amount === "") return [0, token1Float];

    const token0Float = parseFloat(token0Amount ?? "0");
    return [token0Float, token1Float];
  }, [token0Amount, token1Amount]);

  // a display amount representing the amount of token1 worth 1 token0 at the current exchange rate
  const token0Per1Token1 = useMemo(() => {
    if (isSwappingBaseAsset)
      return snapAmountToDecimals(
        getFormattedPriceFromAmount(
          "1",
          token1Price.toString(),
          fUSDC.decimals,
        ),
      );
    if (isSwap1)
      return snapAmountToDecimals(
        (1 / Number(token0Price.toString())) * 10 ** fUSDC.decimals,
      );
    return snapAmountToDecimals(Number(token1Price) / Number(token0Price));
  }, [isSwappingBaseAsset, isSwap1, token0Price, token1Price]);

  // read the allowance of the token
  const { data: allowanceData } = useSimulateContract({
    address: token0.address,
    abi: LightweightERC20,
    // @ts-ignore this needs to use useSimulateContract which breaks the types
    functionName: "allowance",
    // @ts-ignore
    args: [address as Hash, ammAddress],
  });

  const usdPriceToken0 = snapAmountToDecimals(
    token0.address === fUSDC.address
      ? token0AmountFloat
      : getFormattedPriceFromAmount(
          token0AmountFloat.toString(),
          token0Price,
          fUSDC.decimals,
        ),
  );

  const usdPriceToken1 = snapAmountToDecimals(
    token1.address === fUSDC.address
      ? token1AmountFloat
      : getFormattedPriceFromAmount(
          token1AmountFloat.toString(),
          token1Price,
          fUSDC.decimals,
        ),
  );

  // wait for the approval transaction to complete
  const approvalResult = useWaitForTransactionReceipt({
    hash: approvalData,
  });

  const onSubmit = () => {
    if (!allowanceData?.result || allowanceData.result === BigInt(0)) {
      writeContractApproval({
        address: token0.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [ammAddress, maxUint256],
      });
    } else {
      performSwap();
    }
  };

  const performSwap = useCallback(() => {
    writeContractSwap({
      ...swapOptions,
      // Typescript doesn't support strongly typing this with destructuring
      // https://github.com/microsoft/TypeScript/issues/46680
      // @ts-expect-error
      args: swapOptions.args,
    });
  }, [swapOptions, writeContractSwap]);

  const swapResult = useWaitForTransactionReceipt({
    hash: swapData,
  });

  // once we have the result, initiate the swap
  useEffect(() => {
    if (!approvalResult.data) return;
    performSwap();
  }, [approvalResult.data, performSwap]);

  if (isApprovalPending || (approvalData && !approvalResult.data)) {
    return (
      <EnableSpending
        tokenName={token0.symbol}
        transactionHash={approvalData}
      />
    );
  }

  if (isSwapPending || (swapData && !swapResult.data)) {
    return (
      <Confirm
        text={"Swap"}
        fromAsset={{ symbol: token0.symbol, amount: token0Amount ?? "0" }}
        toAsset={{ symbol: token1.symbol, amount: token1Amount ?? "0" }}
        transactionHash={swapData}
      />
    );
  }

  // success
  if (swapResult.data) {
    return (
      <Success
        onDone={() => {
          setToken0Amount("0");
          setToken1Amount("0");
          resetApproval();
          resetSwap();
          swapResult.refetch();
          router.push("/");
        }}
        transactionHash={swapData}
      />
    );
  }

  // error
  if (swapError || approvalError) {
    const error = swapError || approvalError;
    return (
      <Fail
        text={(error as any)?.shortMessage}
        onDone={() => {
          resetApproval();
          resetSwap();
          swapResult.refetch();
          router.push("/");
        }}
      />
    );
  }
  return (
    <div className="z-10 flex flex-col items-center">
      <motion.div
        layoutId={"modal"}
        className={cn("w-[317px] rounded-lg bg-black text-white md:w-[393px]")}
      >
        <div className="flex flex-row items-center justify-between p-[9px]">
          <div className="p-[6px] text-3xs md:text-xs">Swap Confirmation</div>
          <Button
            size="esc"
            variant={"secondary"}
            onClick={() => router.back()}
          >
            Esc
          </Button>
        </div>

        <div className={cn("mt-[15px] pl-[21px]")}>
          <div className="mt-0.5 text-2xs text-gray-2 md:text-xs">Swap</div>
          <div className="mt-1 flex flex-row items-center gap-1 text-2xl">
            <TokenIcon src={token0.icon} className={"size-[24px] invert"} />{" "}
            {snapAmountToDecimals(parseFloat(token0Amount ?? "0"))}{" "}
            {token0.symbol}
          </div>
          <div className="mt-0.5 text-2xs text-gray-2 md:text-xs">
            = ${usdPriceToken0}
          </div>
        </div>

        <div className={cn("mt-[23px] pl-[21px]")}>
          <div className="mt-1 flex flex-row items-center gap-1 text-2xl">
            <TokenIcon src={token1.icon} className={"size-[24px] invert"} />{" "}
            {snapAmountToDecimals(parseFloat(token1Amount ?? "0"))}{" "}
            {token1.symbol}
          </div>
          <div className="mt-0.5 text-2xs text-gray-2 md:text-xs">
            = ${usdPriceToken1}
          </div>
        </div>

        <div className={cn("mt-[29px] px-[21px] md:mt-[37px]")}>
          <div className="mt-[13px] flex flex-col gap-[5px] px-[4px] text-2xs">
            <div className="flex flex-row justify-between">
              <div>Rate</div>
              <div className="flex flex-row">
                {`1 ${token1.symbol} = ${token0Per1Token1} ${token0.symbol}`}
                &nbsp;
                <div className="text-2xs text-gray-2 md:text-xs">
                  ($
                  {token1.address === fUSDC.address
                    ? "1.00"
                    : snapAmountToDecimals(
                        getFormattedPriceFromAmount(
                          "1",
                          token1Price,
                          fUSDC.decimals,
                        ),
                        2,
                      )}
                  )
                </div>
              </div>
            </div>
            <div className="flex flex-row justify-between">
              <div>Max. Slippage</div>
              <div>Auto</div>
            </div>
            <div className="flex flex-row justify-between">
              <div>Fees</div>
              <div className="flex items-center">
                Gas <Gas className="text-white" />
                {formatEther(gas)} SPN
              </div>
            </div>
            <div className="flex flex-row justify-end">
              <span>
                Pool Fee {+feePercentage.toFixed(6)}% ={" "}
                {+(usdPriceToken0 * feePercentage).toFixed(6)}$
              </span>
            </div>

            <div className="flex flex-row justify-between">
              <div>Rewards</div>
              <div>???</div>
            </div>

            <div className="flex flex-row justify-between">
              <div>Route</div>
              <div>Super Route</div>
            </div>
          </div>
        </div>

        <RewardsBreakdown hidden={!showSwapBreakdown} />

        <div className=" flex flex-col items-center p-[15px]">
          <Button
            variant={"secondary"}
            className="w-full max-w-[350px]"
            onClick={onSubmit}
          >
            Confirm Swap
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
