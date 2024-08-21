"use client";

import { WelcomeGradient } from "@/app/WelcomeGradient";
import { CampaignBanner } from "@/components/CampaignBanner";
import Gas from "@/assets/icons/gas.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Token from "@/assets/icons/token.svg";
import Swap from "@/assets/icons/Swap.svg";
import ArrowDown from "@/assets/icons/arrow-down-white.svg";
import { SuperloopPopover } from "@/app/SuperloopPopover";
import { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { sqrtPriceX96ToPrice } from "@/lib/math";
import { motion } from "framer-motion";
import { useWelcomeStore } from "@/stores/useWelcomeStore";
import Link from "next/link";
import { useSwapStore } from "@/stores/useSwapStore";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import {
  useAccount,
  useBalance,
  useSimulateContract,
  useClient,
  useChainId,
  useConnectorClient,
} from "wagmi";
import { formatEther, maxUint256 } from "viem";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { ammAddress } from "@/lib/addresses";
import { output as seawaterContract } from "@/lib/abi/ISeawaterAMM";
import { fUSDC } from "@/config/tokens";
import { LoaderIcon } from "lucide-react";
import { graphql, useFragment } from "@/gql";
import { useGraphqlGlobal } from "@/hooks/useGraphql";
import { usdFormat } from "@/lib/usdFormat";
import { useToast } from "@/components/ui/use-toast";
import { estimateContractGas } from "viem/actions";
import {
  getFormattedPriceFromAmount,
  snapAmountToDecimals,
} from "@/lib/amounts";
import { RewardsBreakdown } from "@/components/RewardsBreakdown";
import { useRouter } from "next/navigation";
import { TokenIcon } from "./TokenIcon";

const SwapFormFragment = graphql(`
  fragment SwapFormFragment on SeawaterPool {
    address
    fee
    earnedFeesAPRFUSDC
    earnedFeesAPRToken1
    token {
      address
      decimals
      name
      symbol
    }
  }
`);

export const SwapForm = () => {
  const [breakdownHidden, setBreakdownHidden] = useState(true);

  const { setWelcome, welcome, hovering, setHovering } = useWelcomeStore();

  const toast = useToast();
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);

  const showSuperloopPopover = useFeatureFlag("ui show superloop");
  const showCampaignBanner = useFeatureFlag("ui show campaign banner");
  const showMockData = useFeatureFlag("ui show demo data");
  const showSwapBreakdown = useFeatureFlag("ui show swap breakdown");

  useEffect(() => {
    if (!welcome) {
      inputRef.current?.focus();
    }
  }, [welcome]);

  const {
    token0,
    token1,
    flipTokens,
    token0Amount,
    token0AmountRaw,
    token1Amount,
    setToken0Amount,
    setToken0AmountRaw,
    setToken1AmountRaw,
    gas,
    setGas,
    feePercentage,
    setFeePercentage,
  } = useSwapStore();
  const { data } = useGraphqlGlobal();

  const [token0AmountFloat, token1AmountFloat] = useMemo(() => {
    const token1Float = parseFloat(token1Amount ?? "0");
    if (token0Amount === "." || token0Amount === "") return [0, token1Float];

    const token0Float = parseFloat(token0Amount ?? "0");
    return [token0Float, token1Float];
  }, [token0Amount, token1Amount]);

  // priceRatio is the amount of token0 worth 1 token1 for the current swap inputs
  const priceRatio = useMemo(() => {
    if (token1AmountFloat === 0) return 0;
    return token0AmountFloat / token1AmountFloat;
  }, [token0AmountFloat, token1AmountFloat]);

  const poolsData = useFragment(SwapFormFragment, data?.pools);

  const poolData = useMemo(() => {
    // find the pool containing token0 or token1
    return poolsData?.find((pool) => {
      return (
        pool.token.address === token0.address ||
        pool.token.address === token1.address
      );
    });
  }, [poolsData, token0.address, token1.address]);

  useEffect(() => {
    if (poolData?.fee) {
      setFeePercentage(poolData.fee);
    }
  }, [poolData?.fee, setFeePercentage]);

  const { address, chainId } = useAccount();
  const expectedChainId = useChainId();
  const isCorrectChain = useMemo(
    () => chainId === expectedChainId,
    [chainId, expectedChainId],
  );

  // the user is currently swapping the "base" asset, the fUSDC
  // asset, into the other.
  const isSwappingBaseAsset = token0.address === fUSDC.address;

  // the user is currently swapping between fUSDC and another asset, in either direction.
  const isSwap1 = isSwappingBaseAsset || token1.address === fUSDC.address;

  // the pool currently in use's price
  const poolAddress = isSwappingBaseAsset ? token1!.address : token0.address;

  // useSimulateContract throws if connector.account is not defined
  // so we must check if it exists or use a dummy address for sqrtPriceX96 and quote/quote2
  const { data: connector } = useConnectorClient();
  const simulateAccount =
    connector?.account ?? "0x1111111111111111111111111111111111111111";

  // price of the current pool
  const { data: poolSqrtPriceX96 } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    account: simulateAccount,
    functionName: "sqrtPriceX967B8F5FC5",
    args: [poolAddress],
  });

  const { data: token1SqrtPriceX96 } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    account: simulateAccount,
    functionName: "sqrtPriceX967B8F5FC5",
    args: [token1.address],
  });

  const token0Price = poolSqrtPriceX96
    ? sqrtPriceX96ToPrice(poolSqrtPriceX96.result, token0.decimals)
    : 0n;

  const token1Price = token1SqrtPriceX96
    ? sqrtPriceX96ToPrice(token1SqrtPriceX96.result, token1.decimals)
    : 0n;

  const { data: token0Balance } = useBalance({
    address,
    token: token0.address,
  });

  const { data: token1Balance } = useBalance({
    address,
    token: token1.address,
  });

  const { error: quote1Error, isLoading: quote1IsLoading } =
    useSimulateContract({
      address: ammAddress,
      account: simulateAccount,
      abi: seawaterContract.abi,
      functionName: "quote72E2ADE7",
      args: [
        poolAddress,
        token1.address === fUSDC.address,
        BigInt(token0AmountRaw ?? 0),
        maxUint256,
      ],
      // since this is intended to throw an error, we want to disable retries
      query: {
        retry: false,
        retryOnMount: false,
      },
    });

  const client = useClient();

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

  // TODO this is in ETH(/SPN), not USD
  useEffect(() => {
    (async () => {
      if (!client || !address) return;
      try {
        const estimatedGas = await estimateContractGas(client, {
          ...swapOptions,
          // Typescript doesn't support strongly typing this with destructuring
          // https://github.com/microsoft/TypeScript/issues/46680
          // @ts-expect-error
          args: swapOptions.args,
          account: address,
        });
        setGas(estimatedGas);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [address, client, token1, token0AmountRaw, setGas, swapOptions]);

  const { error: quote2Error, isLoading: quote2IsLoading } =
    useSimulateContract({
      address: ammAddress,
      abi: seawaterContract.abi,
      account: simulateAccount,
      functionName: "quote2CD06B86E",
      args: [
        token0.address,
        token1.address,
        BigInt(token0AmountRaw ?? 0),
        // TODO minout
        0n,
      ],
      // since this is intended to throw an error, we want to disable retries
      query: {
        retry: false,
        retryOnMount: false,
      },
    });

  /**
   * Parse the quote amount from the error message
   */
  const [quoteAmount, quoteIsLoading] = useMemo(() => {
    const quoteError = isSwap1 ? quote1Error : quote2Error;
    const quoteIsLoading = isSwap1 ? quote1IsLoading : quote2IsLoading;
    const [, quoteAmountString] =
      quoteError?.message.match(
        /reverted with the following reason:\n(.+)\n/,
      ) || [];

    return [BigInt(quoteAmountString ?? 0), quoteIsLoading];
  }, [
    token0,
    token1,
    isSwap1,
    quote1Error,
    quote1IsLoading,
    quote2Error,
    quote2IsLoading,
  ]);

  // update the token1 amount when the quote amount changes
  useEffect(() => {
    setToken1AmountRaw(quoteAmount.toString() ?? "0");
  }, [quoteAmount, setToken1AmountRaw]);

  const setMaxBalance = () => {
    setToken0AmountRaw(token0Balance?.value.toString() ?? token0Amount ?? "0");
  };

  const { open } = useWeb3Modal();

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
  // make user confirm before receiving 0 tokens from a swap
  const [allowZeroSwap, setAllowZeroSwap] = useState(false);

  useEffect(() => {
    setAllowZeroSwap(false);
  }, [token0, token1, token0AmountFloat, token1AmountFloat]);

  /**
   * Approve the AMM to spend the token
   *
   * Step 1.
   */
  const onSubmit = () => {
    if (!token0Amount || token0Amount === "") {
      toast.toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount",
      });
      return;
    }
    if (token1AmountFloat === 0 && !allowZeroSwap) {
      toast.toast({
        variant: "destructive",
        title: "Zero Value Swap",
        description: `This swap will result in you receiving 0 ${token1.symbol}. Press "Swap" again to make the swap anyway.`,
      });
      setAllowZeroSwap(true);
      return;
    }

    router.push(`/swap/confirm`);
  };

  return (
    <>
      <WelcomeGradient />

      <motion.div
        variants={{
          default: {
            y: 0,
            filter: "blur(0px)",
          },
          hovering: {
            y: -10,
            filter: "blur(0px)",
          },
          notHovering: {
            filter: "blur(2px)",
          },
        }}
        initial={"notHovering"}
        animate={welcome ? (hovering ? "hovering" : "notHovering") : "default"}
        className={cn("group z-10 flex flex-col items-center", {
          "cursor-pointer": welcome,
        })}
        onClick={() => setWelcome(false)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className={"flex w-[317px] flex-col items-center md:w-[392.42px]"}>
          <motion.div
            className={"w-full"}
            initial={"hidden"}
            variants={{
              hidden: {
                opacity: 0,
                y: 10,
              },
              visible: {
                opacity: 1,
                y: 0,
              },
            }}
            animate={welcome ? "hidden" : "visible"}
          >
            {showCampaignBanner && <CampaignBanner />}
          </motion.div>

          <motion.div
            layoutId={"modal"}
            className="relative mt-[19px] h-[102px] w-[317px] rounded-lg bg-black pb-[19px] pl-[21px] pr-[15px] pt-[17px] text-white md:h-[126.37px] md:w-[392.42px] md:pb-[25px] md:pl-[25px] md:pr-[20px] md:pt-[22px]"
          >
            {showSuperloopPopover ? <SuperloopPopover /> : <></>}

            <motion.div
              layout
              className={"flex h-full flex-col justify-between"}
            >
              <div className={"flex flex-row items-center justify-between"}>
                <div className={"text-[8px] md:text-[10px]"}>Swap</div>

                <div className={"text-[8px] md:text-[10px]"}>{token0.name}</div>
              </div>

              <div className={"flex flex-row items-center justify-between"}>
                <Input
                  ref={inputRef}
                  className="-ml-2 border-0 bg-black pl-2 text-2xl"
                  variant={"no-ring"}
                  placeholder={welcome ? "1024.82" : undefined}
                  value={token0Amount}
                  onChange={(e) =>
                    setToken0Amount(
                      e.target.value,
                      token0Balance?.value.toString(),
                    )
                  }
                />

                <Link href={"/swap/explore?token=0"}>
                  <Badge
                    variant="outline"
                    className="flex h-[26px] w-max cursor-pointer flex-row justify-between space-x-1 pl-0.5 pr-1 text-white md:h-[33px] md:pl-[4px] md:text-base"
                  >
                    <TokenIcon
                      className="size-[20px] md:size-[25px]"
                      src={token0.icon}
                    />
                    <div>{token0.symbol}</div>
                    <ArrowDown className="ml-1 h-[5.22px] w-[9.19px] md:h-[6.46px] md:w-[11.38px]" />
                  </Badge>
                </Link>
              </div>

              <div className={"flex flex-row items-center justify-between"}>
                <div className={"text-[10px] text-zinc-400"}>
                  ${usdPriceToken0}
                </div>

                <div
                  className={
                    "flex flex-row gap-[17px] text-[8px] md:text-[10px]"
                  }
                >
                  {token0Balance && (
                    <div>Balance: {token0Balance.formatted}</div>
                  )}
                  <div
                    onClick={setMaxBalance}
                    className={"cursor-pointer underline"}
                  >
                    Max
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className={"flex flex-col items-center"}
            initial={welcome ? "visible" : "hidden"}
            exit={"hidden"}
            variants={{
              hidden: {
                opacity: 0,
                y: 100,
              },
              visible: {
                opacity: 1,
                y: 0,
              },
            }}
            animate={"visible"}
          >
            <Button
              variant={"secondary"}
              className={
                "z-50 mt-[-12px] size-[32px] p-0 transition-all hover:rounded-[20px] hover:bg-white md:mt-[-15px] md:size-[40px]"
              }
              onClick={flipTokens}
            >
              <Swap className="h-[17px] w-[11px]" />
            </Button>

            <div className="mt-[-12px] flex h-[102px] w-[317px] flex-col justify-between rounded-lg bg-black pb-[19px] pl-[21px] pr-[15px] pt-[17px] text-white md:mt-[-15px] md:h-[126.37px] md:w-[392.42px] md:pl-[25px] md:pr-[20px] md:pt-[22px]">
              <div className={"flex flex-row items-center justify-between"}>
                <div className={"text-[8px] md:text-[10px]"}>Receive</div>

                <div className={"text-[8px] md:text-[10px]"}>{token1.name}</div>
              </div>

              <div className={"flex flex-row items-center justify-between"}>
                <div className={"text-2xl"}>
                  {quoteIsLoading ? (
                    <LoaderIcon className="animate-spin" />
                  ) : (
                    snapAmountToDecimals(parseFloat(token1Amount ?? "0"))
                  )}
                </div>

                <Link href={"/swap/explore?token=1"}>
                  <Badge
                    variant="outline"
                    className="flex h-[26px] cursor-pointer flex-row justify-between space-x-1 pl-0.5 pr-1 text-white md:h-[33px] md:pl-[4px] md:text-base"
                  >
                    <TokenIcon
                      className="size-[20px] md:size-[25px]"
                      src={token1.icon}
                    />
                    <div>{token1.symbol}</div>
                    <ArrowDown className="ml-1 h-[5.22px] w-[9.19px] md:h-[6.46px] md:w-[11.38px]" />
                  </Badge>
                </Link>
              </div>

              <div className={"flex flex-row items-center justify-between"}>
                <div className={"text-[10px] text-zinc-400"}>
                  ${usdPriceToken1}
                </div>

                <div
                  className={
                    "flex flex-row gap-[17px] text-[8px] md:text-[10px]"
                  }
                >
                  {token1Balance && (
                    <div>Balance: {token1Balance.formatted}</div>
                  )}
                </div>
              </div>
            </div>

            <div
              className={
                "mt-[12px] flex w-full flex-row items-center justify-between"
              }
            >
              <div
                className={cn(
                  "flex flex-row items-center gap-1 text-[10px] md:text-[12px]",
                  {
                    hidden: !breakdownHidden,
                  },
                )}
              >
                <Gas />
                <div>{formatEther(gas)} SPN</div>
              </div>

              <div
                className={cn("text-[10px] md:text-[12px]", {
                  hidden: breakdownHidden,
                })}
              >
                {priceRatio} {token0.symbol} ≈{" "}
                {token1AmountFloat === 0 ? "0" : "1"} {token1.symbol}
              </div>

              <div className={"cursor-pointer text-[10px] md:text-[12px]"}>
                <div
                  onClick={() => setBreakdownHidden((v) => !v)}
                  className="flex cursor-pointer flex-row"
                >
                  {showSwapBreakdown ? (
                    breakdownHidden ? (
                      <>
                        <div className="underline">See breakdown</div>
                        <div className="ml-1">{"->"}</div>
                      </>
                    ) : (
                      <>
                        <div className="underline">Hide breakdown</div>
                        <div className="ml-1 rotate-90">{"<-"}</div>
                      </>
                    )
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            </div>

            <div
              className={cn(
                "flex h-[75px] h-auto w-full flex-col gap-[7px] overflow-hidden text-[10px] transition-all",
                {
                  "h-0": breakdownHidden,
                  "mt-[7px]": !breakdownHidden,
                },
              )}
            >
              <div className={"flex flex-row justify-between"}>
                <div>Fees</div>
                <div className={"flex flex-row items-center gap-1"}>
                  Gas <Gas /> {formatEther(gas)} SPN
                </div>
              </div>
              <div className={"flex flex-row justify-end"}>
                <span>
                  Pool Fee {+feePercentage.toFixed(6)}% ={" "}
                  {+(usdPriceToken0 * feePercentage).toFixed(6)}$
                </span>
              </div>
              <div className={"flex flex-row justify-between"}>
                <div>Rewards</div>
                <Badge className="h-[17px] px-1 text-2xs font-normal">
                  <Token />
                  <Token className={"-ml-1"} />
                  <Token className={"-ml-1 mr-1"} />
                  <div className="iridescent-text">
                    {showMockData
                      ? "$6.11 - $33.12"
                      : `${usdFormat(parseFloat(poolData?.earnedFeesAPRFUSDC[0] ?? "0") ?? 0)} - ${usdFormat(parseFloat(poolData?.earnedFeesAPRFUSDC[1] ?? "0") ?? 0)}`}
                  </div>
                </Badge>
              </div>

              <div className="flex flex-row justify-between">
                <div>Route</div>
                <div>Super Route</div>
              </div>
            </div>

            <Badge
              className={cn(
                "shine mt-[15px] h-[27px] w-full pl-1.5 md:h-[31px]",
                {
                  hidden: !breakdownHidden,
                },
              )}
            >
              <TokenIcon className="size-5 " />
              <TokenIcon className="-ml-1 size-5 " />
              <TokenIcon className="-ml-1.5 size-5 " />

              <div className={"iridescent-text text-[12px] md:text-[14px]"}>
                Earn up to $100 for making this trade!
              </div>
            </Badge>
            <RewardsBreakdown hidden={breakdownHidden} />
            {address ? (
              isCorrectChain ? (
                <Button
                  className={cn(
                    "mt-[20px] inline-flex h-[53.92px] w-full",
                    token1AmountFloat === 0 && !allowZeroSwap && "opacity-50",
                  )}
                  onClick={onSubmit}
                >
                  {!quoteIsLoading &&
                  token0AmountFloat > 0 &&
                  token1AmountFloat === 0 &&
                  !allowZeroSwap
                    ? "Not Enough Liquidity"
                    : "Swap"}
                </Button>
              ) : (
                <Button
                  className={"mt-[20px] inline-flex h-[53.92px] w-full"}
                  variant={"destructiveBorder"}
                  onClick={() => open({ view: "Networks" })}
                >
                  Wrong Network
                </Button>
              )
            ) : (
              <Button
                className={"mt-[20px] inline-flex h-[53.92px] w-full"}
                onClick={() => open()}
              >
                Connect Wallet
              </Button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};
