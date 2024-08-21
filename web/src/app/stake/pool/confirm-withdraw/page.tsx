"use client";

import { Button } from "@/components/ui/button";
import { ammAddress } from "@/lib/addresses";
import { useStakeStore } from "@/stores/useStakeStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { output as seawaterContract } from "@/lib/abi/ISeawaterAMM";
import {
  useAccount,
  useChainId,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { fUSDC } from "@/config/tokens";
import { sqrtPriceX96ToPrice } from "@/lib/math";
import {
  getFormattedPriceFromAmount,
  getUsdTokenAmountsForPosition,
} from "@/lib/amounts";
import Confirm from "@/components/sequence/Confirm";
import { Success } from "@/components/sequence/Success";
import { Fail } from "@/components/sequence/Fail";
import { TokenIcon } from "@/components/TokenIcon";
import { usePositions } from "@/hooks/usePostions";

export default function ConfirmWithdrawLiquidity() {
  const router = useRouter();
  const params = useSearchParams();

  const positionId = params.get("positionId") ?? "0";

  const { address, chainId } = useAccount();
  const expectedChainId = useChainId();

  useEffect(() => {
    if (!address || chainId !== expectedChainId) router.back();
  }, [address, expectedChainId, chainId]);

  const { token0, token0Amount, token0AmountRaw, token1, token1Amount, delta } =
    useStakeStore();

  const { positions, updatePositionLocal } = usePositions();

  // Current liquidity of the position
  const { data: positionLiquidity } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "positionLiquidity8D11C045",
    args: [token0.address, BigInt(positionId ?? 0)],
  });

  const isWithdrawingEntirePosition = positionLiquidity?.result === delta;

  const {
    writeContract: writeContractUpdatePosition,
    data: updatePositionData,
    error: updatePositionError,
    isPending: isUpdatePositionPending,
    reset: resetUpdatePosition,
  } = useWriteContract();

  const updatePositionResult = useWaitForTransactionReceipt({
    hash: updatePositionData,
  });

  const {
    writeContract: writeContractCollect,
    data: collectData,
    error: collectError,
    isPending: isCollectPending,
    reset: resetCollect,
  } = useWriteContract();

  const collectResult = useWaitForTransactionReceipt({
    hash: collectData,
  });

  const updatePosition = useCallback(
    (id: bigint) => {
      writeContractUpdatePosition({
        address: ammAddress,
        abi: seawaterContract.abi,
        functionName: "updatePositionC7F1F740",
        args: [token0.address, id, -delta],
      });
    },
    [delta, writeContractUpdatePosition, token0AmountRaw, token0],
  );

  const collect = useCallback(
    (id: bigint) => {
      writeContractCollect({
        address: ammAddress,
        abi: seawaterContract.abi,
        functionName: "collect7F21947C",
        args: [[token0.address], [BigInt(id ?? 0)]],
      });
    },
    [writeContractCollect, token0],
  );

  // price of the current pool
  const { data: poolSqrtPriceX96 } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "sqrtPriceX967B8F5FC5",
    args: [token0.address === fUSDC.address ? token1.address : token0.address],
  });

  const tokenPrice = poolSqrtPriceX96
    ? sqrtPriceX96ToPrice(poolSqrtPriceX96.result, token0.decimals)
    : 0n;

  const { data: unclaimedRewardsData } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "collect7F21947C",
    args: [[token0.address], [BigInt(positionId ?? 0)]],
  });

  const confirmWithdraw = (id: bigint) => {
    const [{ amount0, amount1 }] = unclaimedRewardsData?.result || [
      { amount0: 0, amount1: 0 },
    ];
    if (isWithdrawingEntirePosition && (amount0 > 0 || amount1 > 0)) {
      collect(id);
    } else {
      updatePosition(BigInt(positionId));
    }
  };

  // once yield is collected, update position
  useEffect(() => {
    if (!collectResult.data || !isWithdrawingEntirePosition) return;
    updatePosition(BigInt(positionId));
  }, [updatePosition, positionId, collectResult.data]);

  useEffect(() => {
    if (updatePositionResult.isSuccess) {
      const position = positions.find(
        (p) => p.positionId === Number(positionId),
      );
      if (position) {
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

  // step 1 - collect yield from position if emptying entire balance
  if (
    isWithdrawingEntirePosition &&
    (isCollectPending || (collectData && collectResult?.isPending))
  ) {
    return (
      <Confirm
        text={"Yield Collection"}
        fromAsset={{ symbol: token0.symbol, amount: token0Amount ?? "0" }}
        toAsset={{ symbol: token1.symbol, amount: token1Amount ?? "0" }}
        transactionHash={updatePositionData}
      />
    );
  }

  // step 2 - update position
  if (
    isUpdatePositionPending ||
    (updatePositionData && updatePositionResult?.isPending)
  ) {
    return (
      <Confirm
        text={"Withdrawal"}
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
        onDone={() => {
          resetUpdatePosition();
          resetCollect();
          router.push("/stake");
        }}
        transactionHash={updatePositionResult.data?.transactionHash}
      />
    );
  }

  // error
  if (updatePositionError || collectError) {
    const error = updatePositionError || collectError;
    return <Fail text={(error as any)?.shortMessage} />;
  }

  return (
    <div className="z-10 flex flex-col items-center">
      <div className="h-[357px] w-[315px] rounded-lg bg-black p-[9px] text-white md:h-[357px] md:w-[394px]">
        <div className="flex flex-row items-center justify-between">
          <div className="px-[21px]  text-[10px] font-medium">
            Withdraw Liquidity Confirmation
          </div>
          <Button
            variant={"secondary"}
            size={"sm"}
            className={
              "h-[20.70px] w-8 text-[8px] md:h-[26px] md:w-9 md:text-[10px]"
            }
            onClick={() => router.back()}
          >
            Esc
          </Button>
        </div>

        <div className="mt-[26px] px-[21px]">
          <div className="text-[8px] font-semibold">{token0.symbol}</div>
          <div className="mt-1 flex flex-row items-center gap-1 text-2xl">
            <TokenIcon src={token0.icon} className={"size-[24px] invert"} />{" "}
            {token0Amount}
          </div>
          <div className="text-[10px] text-neutral-400">
            = $
            {token0.address === fUSDC.address
              ? token0Amount
              : getFormattedPriceFromAmount(
                  token0Amount,
                  tokenPrice,
                  fUSDC.decimals,
                )}
          </div>
        </div>

        <div className="mt-[23px] px-[21px]">
          <div className={"text-[8px] font-semibold"}>{token1.symbol}</div>
          <div className="mt-1 flex flex-row items-center gap-1 text-2xl">
            <TokenIcon src={token1.icon} className={"size-[24px] invert"} />{" "}
            {token1Amount}
          </div>
          <div className="text-[10px] text-neutral-400">
            = $
            {token1.address === fUSDC.address
              ? token1Amount
              : getFormattedPriceFromAmount(
                  token1Amount,
                  tokenPrice,
                  fUSDC.decimals,
                )}
          </div>
        </div>

        <div>
          <div
            className={
              "mt-[35px] flex flex-row justify-between px-[21px] text-[10px]"
            }
          >
            <div>Total Shares</div>
            <div>???</div>
          </div>
          <div
            className={
              "mt-[10px] flex flex-row justify-between px-[21px] text-[10px]"
            }
          >
            <div>Approx. Total Value</div>
            <div className="iridescent rounded-sm px-1 text-black">???%</div>
          </div>
        </div>

        <div className="mt-[22px] px-[7px]">
          <Button
            variant="secondary"
            className="h-10 w-[286px] md:h-10 md:w-[365px]"
            onClick={() => {
              confirmWithdraw(BigInt(positionId));
            }}
          >
            Confirm Withdrawal
          </Button>
        </div>
      </div>
    </div>
  );
}
