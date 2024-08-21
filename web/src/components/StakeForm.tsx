"use client";

import { CampaignBanner } from "@/components/CampaignBanner";
import { Badge } from "@/components/ui/badge";
import ArrowDown from "@/assets/icons/arrow-down-white.svg";
import Padlock from "@/assets/icons/padlock.svg";
import Token from "@/assets/icons/token.svg";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MAX_TICK,
  MIN_TICK,
  getAmount0ForLiquidity,
  getAmount1ForLiquidity,
  getLiquidityForAmount0,
  getLiquidityForAmount1,
  getSqrtRatioAtTick,
  sqrtPriceX96ToPrice,
} from "@/lib/math";
import { ammAddress } from "@/lib/addresses";
import { output as seawaterContract } from "@/lib/abi/ISeawaterAMM";
import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import { AnimatePresence, motion } from "framer-motion";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Input } from "@/components/ui/input";
import { useStakeStore } from "@/stores/useStakeStore";
import SegmentedControl from "@/components/ui/segmented-control";
import {
  useAccount,
  useBalance,
  useChainId,
  useConnectorClient,
  useSimulateContract,
} from "wagmi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Gas from "@/assets/icons/gas.svg";
import Link from "next/link";
import Menu from "@/components/Menu";
import Index from "@/components/Slider";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { graphql, useFragment } from "@/gql";
import { useGraphqlGlobal, useGraphqlUser } from "@/hooks/useGraphql";
import { usdFormat } from "@/lib/usdFormat";
import {
  Token as TokenType,
  fUSDC,
  getTokenFromAddress,
} from "@/config/tokens";
import { getFormattedPriceFromAmount } from "@/lib/amounts";
import { TokenIcon } from "./TokenIcon";
import LiquidityRangeVisualizer from "./LiquidityRangeVisualizer";

type StakeFormProps = { poolId: string } & (
  | {
      mode: "new";
      positionId?: never;
    }
  | {
      mode: "existing";
      positionId: number;
    }
);

const StakeFormFragment = graphql(`
  fragment StakeFormFragment on SeawaterPool {
    address
    earnedFeesAPRFUSDC
    fee
    config {
      classification
    }
    priceOverTime {
      daily
    }
    liquidity {
      tickLower
      tickUpper
      price
      liquidity
    }
  }
`);

const PositionsFragment = graphql(`
  fragment DepositPositionsFragment on Wallet {
    positions {
      positions {
        positionId
        lower
        upper
      }
    }
  }
`);

export const StakeForm = ({ mode, poolId, positionId }: StakeFormProps) => {
  const [feeTier, setFeeTier] = useState<"auto" | "manual">("auto");

  const [breakdownHidden, setBreakdownHidden] = useState(true);

  const {
    multiSingleToken,
    setMultiSingleToken,
    token0,
    setToken0,
    token0Amount,
    token0AmountRaw,
    setToken0Amount,
    setToken0AmountRaw,
    token1,
    setToken1,
    token1Amount,
    token1AmountRaw,
    setToken1Amount,
    setToken1AmountRaw,
    priceLower,
    priceUpper,
    setPriceLower,
    setPriceUpper,
    tickLower,
    tickUpper,
    setTickLower,
    setTickUpper,
    feePercentage,
    setFeePercentage,
  } = useStakeStore();

  // poolId should override tokens if we are redirected
  useEffect(() => {
    if (!poolId) return;
    if (token0.address !== poolId && token1.address !== poolId) {
      const poolToken = getTokenFromAddress(poolId);
      if (!poolToken) {
        router.push("/stake");
        return;
      }
      setToken0(poolToken);
      setToken1(fUSDC);
    }
  }, [poolId, setToken0, setToken1, token0.address, token1.address]);

  // Parse the price lower and upper, and set the ticks properly.

  const { data } = useGraphqlGlobal();
  const { data: userData } = useGraphqlUser();

  const poolsData = useFragment(StakeFormFragment, data?.pools);
  const poolData = poolsData?.find(
    (pool) => pool.address === poolId || pool.address === token0.address,
  );

  useEffect(() => {
    if (poolData?.fee) {
      setFeePercentage(poolData.fee);
    }
  }, [poolData?.fee, setFeePercentage]);

  const dailyPrices = poolData?.priceOverTime.daily.map((price) =>
    parseFloat(price),
  );
  const positionData_ = useFragment(PositionsFragment, userData?.getWallet);
  const positionData = positionData_?.positions.positions.find(
    (p) => p.positionId === positionId,
  );

  const { upper: upperTickPosition, lower: lowerTickPosition } =
    positionData || {
      upper: 0,
      lower: 0,
    };

  useEffect(() => {
    setTickLower(lowerTickPosition);
    setTickUpper(upperTickPosition);
  }, [positionData]);

  const showMockData = useFeatureFlag("ui show demo data");

  const router = useRouter();

  useHotkeys("esc", () => router.back(), { enableOnFormTags: ["INPUT"] });

  const showManualFees = useFeatureFlag("ui show manual fees");
  const showFeeTier = useFeatureFlag("ui show fee tier");
  const showDynamicFeesPopup = useFeatureFlag("ui show optimising fee route");
  const showSingleToken = useFeatureFlag("ui show single token stake");
  const showCampaignBanner = useFeatureFlag("ui show campaign banner");

  const showBoostIncentives = useFeatureFlag("ui show boost incentives");

  const onSubmit = () => {
    if (mode === "new") {
      router.push("/stake/pool/create/confirm");
    } else {
      router.push(`/stake/pool/confirm-liquidity?positionId=${positionId}`);
    }
  };

  const { address, chainId } = useAccount();
  const expectedChainId = useChainId();
  const isCorrectChain = useMemo(
    () => chainId === expectedChainId,
    [chainId, expectedChainId],
  );

  // useSimulateContract throws if connector.account is not defined
  // so we must check if it exists or use a dummy address for sqrtPriceX96
  const { data: connector } = useConnectorClient();
  const simulateAccount =
    connector?.account ?? "0x1111111111111111111111111111111111111111";

  // Price of the current pool
  const { data: poolSqrtPriceX96 } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    account: simulateAccount,
    functionName: "sqrtPriceX967B8F5FC5",
    args: [token0.address],
  });

  const tokenPrice = poolSqrtPriceX96
    ? sqrtPriceX96ToPrice(poolSqrtPriceX96.result, token0.decimals)
    : 0n;

  // in this context, token0 is actually token1. It's converted to token1
  // when we use it.

  const { data: token0Balance } = useBalance({
    address,
    token: token0.address,
  });

  const { data: token1Balance } = useBalance({
    address,
    token: token1.address,
  });

  const [quotedToken, setQuotedToken] = useState<"token0" | "token1">("token0");
  const quoteTokenAmount = (
    value: string,
    quotedToken: "token0" | "token1",
  ) => {
    quotedToken === "token0"
      ? setToken0Amount(value, token0Balance?.value.toString())
      : setToken1Amount(value, token1Balance?.value.toString());
    setQuotedToken(quotedToken);
  };

  // The tick spacing will determine how granular the graph is.
  const { data: curTickNum } = useSimulateContract({
    address: ammAddress,
    abi: seawaterContract.abi,
    functionName: "curTick181C6FD9",
    args: [token0.address],
  });
  const curTick = useMemo(
    () => ({ result: BigInt(curTickNum?.result ?? 0) }),
    [curTickNum],
  );

  useEffect(() => {
    if (!curTick || tickLower === undefined || tickUpper === undefined) return;
    const lower = BigInt(tickLower);
    const upper = BigInt(tickUpper);

    const cur = curTick.result;
    const sqp = getSqrtRatioAtTick(cur);
    const sqa = getSqrtRatioAtTick(lower);
    const sqb = getSqrtRatioAtTick(upper);

    if (quotedToken === "token0") {
      const liq = getLiquidityForAmount0(cur, upper, BigInt(token0AmountRaw));
      const newToken1Amount = getAmount1ForLiquidity(sqa, sqp, liq);
      if (token1Balance?.value && newToken1Amount > token1Balance.value) return;
      setToken1AmountRaw(newToken1Amount.toString());
    } else {
      const liq = getLiquidityForAmount1(cur, lower, BigInt(token1AmountRaw));
      const newToken0Amount = getAmount0ForLiquidity(sqb, sqp, liq);
      if (token0Balance?.value && newToken0Amount > token0Balance.value) return;
      setToken0AmountRaw(newToken0Amount.toString());
    }
  }, [
    setToken0AmountRaw,
    setToken1AmountRaw,
    token0Balance?.value,
    token1Balance?.value,
    token0AmountRaw,
    token1AmountRaw,
    tokenPrice,
    quotedToken,
    curTick,
    tickUpper,
    tickLower,
  ]);

  const setMaxBalance = (token: TokenType) => {
    token.address === token0.address
      ? setToken0AmountRaw(
          token0Balance?.value.toString() ?? token0Amount ?? "0",
        )
      : setToken1AmountRaw(
          token1Balance?.value.toString() ?? token1Amount ?? "0",
        );
  };

  const usdPriceToken0 =
    token0.address === fUSDC.address
      ? parseFloat(token0Amount)
      : getFormattedPriceFromAmount(token0Amount, tokenPrice, fUSDC.decimals);

  const usdPriceToken1 =
    token1.address === fUSDC.address
      ? parseFloat(token1Amount)
      : getFormattedPriceFromAmount(token1Amount, tokenPrice, fUSDC.decimals);

  const [liquidityRangeType, setLiquidityRangeType] = useState<
    "full-range" | "auto" | "custom"
  >("auto");

  // TODO these could all be more precise
  useEffect(() => {
    // set the ticks to the existing ticks of the pool
    if (mode === "existing") {
      const scale = token0.decimals - fUSDC.decimals;
      const priceLower = (1.0001 ** (tickLower ?? 0) * 10 ** scale).toFixed(
        fUSDC.decimals,
      );
      const priceHigher = (1.0001 ** (tickUpper ?? 0) * 10 ** scale).toFixed(
        fUSDC.decimals,
      );
      setPriceLower(priceLower, token0.decimals);
      setPriceUpper(priceHigher, token0.decimals);
      return;
    }

    // set the ticks to min and max, ignoring display prices
    // which will be shown as infinity
    if (liquidityRangeType === "full-range") {
      setTickLower(MIN_TICK);
      setTickUpper(MAX_TICK);
    } else if (liquidityRangeType === "auto") {
      if (!curTick) return;
      // auto sets the price range to +-10% of the current tick
      const priceAtTick = sqrtPriceX96ToPrice(
        getSqrtRatioAtTick(curTick.result),
        token0.decimals,
      );
      let priceLower: string;
      let priceUpper: string;
      if (
        poolData?.config.classification === "VOLATILE" &&
        dailyPrices &&
        dailyPrices.length >= 2
      ) {
        const lastSevenDays = dailyPrices.reverse().slice(0, 7);

        priceLower = Math.min(...lastSevenDays).toFixed(fUSDC.decimals);
        priceUpper = Math.max(...lastSevenDays).toFixed(fUSDC.decimals);
      } else {
        const diff = priceAtTick / 10n;
        const pu = priceAtTick + diff;
        const pl = priceAtTick - diff;
        priceLower = (Number(pl) / 10 ** fUSDC.decimals).toFixed(
          fUSDC.decimals,
        );
        priceUpper = (Number(pu) / 10 ** fUSDC.decimals).toFixed(
          fUSDC.decimals,
        );
      }

      setPriceLower(priceLower, token0.decimals);
      setPriceUpper(priceUpper, token0.decimals);
    }
  }, [
    mode,
    curTick,
    setPriceLower,
    setPriceUpper,
    token1.decimals,
    liquidityRangeType,
  ]);

  const autoFeeTierRef = useRef();
  const manualFeeTierRef = useRef();

  const { open } = useWeb3Modal();

  return (
    <div className="z-10 flex flex-col items-center">
      <div className="w-[318px] md:w-[392px]">
        {showCampaignBanner && <CampaignBanner />}
      </div>

      <div className="mt-[23px] flex flex-col gap-[5px] md:gap-[7px]">
        <motion.div
          layoutId="modal"
          className="relative h-[102px] w-[318px] justify-between rounded-lg bg-black p-[17px] text-white md:h-[150px] md:w-[392px] md:p-[25px]"
        >
          <motion.div className="flex flex-col">
            <div
              className={cn("absolute -top-[15px] left-0 hidden md:flex", {
                flex: mode === "existing",
              })}
            >
              <TokenIcon
                src={token0.icon}
                className="size-[30px] rounded-full border border-white"
              />
              <Badge
                variant="outline"
                className="-ml-2 h-[30px] justify-between border-[3px] bg-black pl-px text-white"
              >
                <Token className="size-[25px] invert" />
                ƒUSDC - {token0.symbol}
              </Badge>
            </div>

            {showSingleToken && mode === "existing" && (
              <div className="absolute right-0 top-[-15px]">
                <Menu
                  id={"tokens"}
                  background="dark"
                  className={
                    "flex h-[26px] w-[132px] flex-row items-center justify-center gap-2 rounded-lg bg-black md:h-[28px] md:w-[154px]"
                  }
                >
                  <Menu.Item
                    className={"h-[18px]"}
                    selected={multiSingleToken === "multi"}
                    onClick={() => setMultiSingleToken("multi")}
                  >
                    <div className="text-nowrap px-1 text-3xs font-medium md:text-2xs">
                      Multi-Token
                    </div>
                  </Menu.Item>
                  <Menu.Item
                    className={"h-[18px]"}
                    selected={multiSingleToken === "single"}
                    onClick={() => setMultiSingleToken("single")}
                    variant={"iridescent"}
                  >
                    <div className="text-nowrap px-1 text-3xs font-medium md:text-2xs">
                      Single-Token
                    </div>
                  </Menu.Item>
                </Menu>
              </div>
            )}

            <div className="absolute -right-16 top-0 hidden md:inline-flex">
              <Button
                size={"sm"}
                className="h-[30px] w-[48px]"
                onClick={() => router.back()}
              >
                {"<-"} Esc
              </Button>
            </div>

            <div className="flex w-full flex-row items-center justify-between md:mt-[10px]">
              <div className="text-3xs md:text-2xs">Prime Asset</div>

              <div className="text-3xs md:text-2xs">{token0.name}</div>
            </div>

            <div className="mt-[7px] flex w-full flex-row items-center justify-between gap-4">
              <Input
                className="-ml-2 border-0 bg-black pl-2 text-2xl"
                autoFocus
                variant={"no-ring"}
                value={token0Amount}
                onChange={(e) => quoteTokenAmount(e.target.value, "token0")}
              />

              <Link
                href={"/stake/pool/create/select-prime-asset"}
                legacyBehavior
              >
                <Badge
                  variant="outline"
                  className="flex h-[26px] cursor-pointer flex-row justify-between gap-1 pl-0.5 pr-1 text-white md:h-[33px] md:pl-[4px] md:text-base"
                >
                  <TokenIcon
                    src={token0.icon}
                    className="size-[20px] invert md:size-[25px]"
                  />
                  <div>{token0.symbol}</div>
                  <ArrowDown className="h-[5.22px] w-[9.19px] md:h-[6.46px] md:w-[11.38px]" />
                </Badge>
              </Link>
            </div>

            <div className="mt-[5px] flex w-full flex-row items-center justify-between">
              <div className="text-2xs md:text-gray-1">${usdPriceToken0}</div>

              <div className="flex flex-row gap-[8px] text-3xs md:text-2xs">
                {token0Balance && (
                  <>
                    <div>Balance: {token0Balance.formatted}</div>
                    <div
                      className="cursor-pointer underline"
                      onClick={() => setMaxBalance(token0)}
                    >
                      Max
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <AnimatePresence mode={"popLayout"} initial={true}>
          {(mode === "new" || multiSingleToken === "multi") && (
            <motion.div
              initial={{ y: -102, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -102, opacity: 0 }}
              className="flex h-[102px] w-[318px] flex-col justify-between rounded-lg bg-black p-[17px] text-white md:h-[126px] md:w-[392px] md:p-[25px]"
            >
              <div className="flex w-full flex-row items-center justify-between">
                <div className="text-3xs md:text-2xs">Super Asset</div>

                <div className="text-3xs md:text-2xs">Fluid USDC</div>
              </div>

              <div className="mt-[7px] flex w-full flex-row items-center justify-between">
                <Input
                  className="-ml-2 border-0 bg-black pl-2 text-2xl"
                  autoFocus
                  variant={"no-ring"}
                  value={token1Amount}
                  onChange={(e) => quoteTokenAmount(e.target.value, "token1")}
                />

                <Badge
                  variant="outline"
                  className="flex h-[26px] w-[82px] flex-row justify-between pl-0.5 pr-1 text-white md:h-[33px] md:w-[107px] md:pl-[4px] md:text-base"
                >
                  <TokenIcon
                    src={token1.icon}
                    className="size-[20px] invert md:size-[25px]"
                  />
                  <div className="iridescent-text">ƒUSDC</div>
                  <Padlock className="ml-[2px] h-[7.53px] w-[6.45px] md:h-[10.3px] md:w-[8.82px]" />
                </Badge>
              </div>

              <div className="mt-[5px] flex w-full flex-row items-center justify-between">
                <div className="text-2xs md:text-gray-1">${usdPriceToken1}</div>
                <div className="flex flex-row gap-[8px] text-3xs md:text-2xs">
                  {token1Balance && (
                    <>
                      <div>Balance: {token1Balance.formatted}</div>
                      <div
                        className="cursor-pointer underline"
                        onClick={() => setMaxBalance(token1)}
                      >
                        Max
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.div
        className={"flex flex-col items-center"}
        initial={{
          opacity: 0,
          y: 100,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: 100,
        }}
      >
        {showFeeTier && (
          <div className="mt-[12px] flex w-[318px] flex-row items-center justify-between md:w-[392px]">
            <div className="text-3xs md:text-2xs">Fee Tier</div>

            <SegmentedControl
              variant={"secondary"}
              className={cn(
                "h-[26px] rounded-lg bg-black text-3xs md:text-2xs",
                {
                  hidden: !showManualFees,
                },
              )}
              callback={(val) => setFeeTier(val)}
              segments={[
                {
                  label: "Auto",
                  value: "auto" as const,
                  ref: autoFeeTierRef,
                },
                {
                  label: "Manual",
                  value: "manual" as const,
                  ref: manualFeeTierRef,
                },
              ]}
            />
          </div>
        )}

        {showDynamicFeesPopup && (
          <AnimatePresence initial={false} mode="popLayout">
            {feeTier === "auto" && (
              <motion.div
                key={"auto"}
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                className="shine mt-[12px] flex h-[60px] w-[318px] flex-row items-center justify-between rounded-lg px-[22px] py-[15px] md:h-[69px] md:w-[392px]"
              >
                <div className="flex flex-col items-center gap-[3px]">
                  <div className="iridescent-text text-xs font-medium md:text-sm">
                    {+feePercentage.toFixed(6)}%
                  </div>
                  <Badge
                    variant="iridescent"
                    className="h-[10px] px-[7px] text-4xs font-normal md:h-[12px] md:text-3xs"
                  >
                    Fee Percentage
                  </Badge>
                </div>

                <div className="iridescent-text w-[200px] text-3xs md:w-[247px] md:text-2xs">
                  The protocol automatically adjust your fees in order to
                  maximise rewards and reduce impermanent loss
                </div>
              </motion.div>
            )}
            {feeTier === "manual" && (
              <motion.div
                key={"manual"}
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
              >
                <RadioGroup.Root
                  className="mt-[12px] flex h-[60px] w-[318px] flex-row items-center justify-between gap-[5px] rounded-lg md:h-[69px] md:w-[392px]"
                  defaultValue="0.05"
                >
                  <RadioGroup.Item
                    value="0.01"
                    className="flex h-[66px] w-[75px] flex-col items-center rounded-md border border-black px-[7px] pb-[7px] pt-[9px] hover:bg-gray-0 data-[state=checked]:bg-black data-[state=checked]:text-white md:h-[80px] md:w-[93px] md:gap-1"
                  >
                    <div className="text-2xs font-medium md:text-xs">0.01%</div>
                    <div className="text-center text-3xs text-gray-2 ">
                      Best for Very <br /> Stable Pairs
                    </div>
                    <div className="rounded bg-[#D8D8D8] px-1 text-4xs text-gray-2 md:text-3xs">
                      (0% popularity)
                    </div>
                  </RadioGroup.Item>

                  <RadioGroup.Item
                    value={"0.05"}
                    className="flex h-[66px] w-[75px] flex-col items-center rounded-md border border-black px-[7px] pb-[7px] pt-[9px] hover:bg-gray-0 data-[state=checked]:bg-black data-[state=checked]:text-white md:h-[80px] md:w-[93px] md:gap-1"
                  >
                    <div className="text-2xs font-medium md:text-xs">0.05%</div>
                    <div className="text-center text-3xs text-gray-2 ">
                      Best for <br /> Stable Pairs
                    </div>
                    <div className="iridescent rounded bg-[#D8D8D8] px-1 text-4xs text-black md:text-3xs">
                      (99% popularity)
                    </div>
                  </RadioGroup.Item>

                  <RadioGroup.Item
                    value={"0.10"}
                    className="flex h-[66px] w-[75px] flex-col items-center rounded-md border border-black px-[7px] pb-[7px] pt-[9px] hover:bg-gray-0 data-[state=checked]:bg-black data-[state=checked]:text-white md:h-[80px] md:w-[93px] md:gap-1"
                  >
                    <div className="text-2xs font-medium md:text-xs">0.10%</div>
                    <div className="text-center text-3xs text-gray-2 ">
                      Best for <br /> Stable Pairs
                    </div>
                    <div className="rounded bg-[#D8D8D8] px-1 text-4xs text-gray-2 md:text-3xs">
                      (0% popularity)
                    </div>
                  </RadioGroup.Item>

                  <RadioGroup.Item
                    value={"0.15"}
                    className="flex h-[66px] w-[75px] flex-col items-center rounded-md border border-black px-[7px] pb-[7px] pt-[9px] hover:bg-gray-0 data-[state=checked]:bg-black data-[state=checked]:text-white md:h-[80px] md:w-[93px] md:gap-1"
                  >
                    <div className="text-2xs font-medium md:text-xs">0.15%</div>
                    <div className="text-center text-3xs text-gray-2 ">
                      Best for <br /> Stable Pairs
                    </div>
                    <div className="rounded bg-[#D8D8D8] px-1 text-4xs text-gray-2 md:text-3xs">
                      (0% popularity)
                    </div>
                  </RadioGroup.Item>
                </RadioGroup.Root>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div className="mt-[20px] w-[318px] rounded-lg bg-black px-[20px] py-[11px] text-white md:w-[392px]">
          <div className="flex w-full flex-row items-center justify-between">
            <div className="text-3xs md:text-2xs">Liquidity Range</div>

            <SegmentedControl
              variant={"secondary"}
              className={"text-3xs md:text-2xs"}
              callback={(val) => setLiquidityRangeType(val)}
              // default to auto
              defaultIndex={1}
              segments={[
                {
                  label: "Full Range",
                  value: "full-range",
                  ref: useRef(),
                  disabled: mode === "existing",
                },
                {
                  label: "Auto",
                  value: "auto",
                  ref: useRef(),
                  disabled: mode === "existing",
                },
                {
                  label: "Custom",
                  value: "custom",
                  ref: useRef(),
                  disabled: mode === "existing",
                },
              ]}
            />
          </div>

          <div className="mt-[22px] flex flex-row items-start justify-between gap-6 px-[5px] md:mt-[24px] md:w-[270px]">
            <div className="flex flex-col">
              <div className="text-3xs text-gray-2 md:text-2xs">Low Price</div>
              <Input
                className={cn(
                  liquidityRangeType === "full-range"
                    ? "md:text-2xl"
                    : "md:text-sm",
                  "rounded-none border-x-0 border-b border-t-0 border-b-white bg-black px-0 text-2xs font-semibold",
                )}
                disabled={
                  liquidityRangeType !== "custom" || mode === "existing"
                }
                variant={"no-ring"}
                value={liquidityRangeType === "full-range" ? "-∞" : priceLower}
                onChange={(e) => setPriceLower(e.target.value, token0.decimals)}
              />
              <div className="mt-1 flex flex-row items-start gap-1 whitespace-nowrap text-3xs font-semibold">
                <Token className="size-[12px]  invert" /> fUSDC per{" "}
                {token0.name}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-3xs text-gray-2 md:text-2xs">High Price</div>

              <Input
                variant={"no-ring"}
                className={cn(
                  liquidityRangeType === "full-range"
                    ? "md:text-2xl"
                    : "md:text-sm",
                  "rounded-none border-x-0 border-b border-t-0 border-b-white bg-black px-0 text-2xs font-semibold ",
                )}
                disabled={
                  liquidityRangeType !== "custom" || mode === "existing"
                }
                value={liquidityRangeType === "full-range" ? "∞" : priceUpper}
                onChange={(e) => setPriceUpper(e.target.value, token0.decimals)}
              />

              <div className="mt-1 flex flex-row items-start gap-1 whitespace-nowrap text-3xs font-semibold">
                <Token className="size-[12px]  invert" /> fUSDC per{" "}
                {token0.name}
              </div>
            </div>
          </div>

          {poolData?.liquidity ? (
            <LiquidityRangeVisualizer
              liquidityRangeType={liquidityRangeType}
              poolDataLiquidity={poolData.liquidity}
              currentPrice={tokenPrice}
              tokenDecimals={token0.decimals}
            />
          ) : null}
        </div>
        <div className="mt-[21px] flex w-[318px] flex-row justify-end md:w-[392px]">
          <div
            onClick={() => setBreakdownHidden((v) => !v)}
            className="flex cursor-pointer flex-row"
          >
            {breakdownHidden ? (
              <>
                <div className="text-2xs underline">Show Breakdown</div>
                <div className="ml-1 rotate-90 text-2xs">{"<-"}</div>
              </>
            ) : (
              <>
                <div className="text-2xs underline">Hide breakdown</div>
                <div className="ml-1 rotate-90 text-2xs">{"->"}</div>
              </>
            )}
          </div>
        </div>

        <div
          className={cn(
            "mt-[10px] flex h-[60px] w-[318px] flex-col gap-[5px] overflow-hidden text-2xs transition-[height] md:w-[392px]",
            {
              "h-0": breakdownHidden,
            },
          )}
        >
          <div className="flex flex-row justify-between">
            <div>Fees</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className={"flex flex-row items-center gap-1"}>
                    <Gas />
                    $3.55
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side={"bottom"}
                  className={
                    "rounded-lg border-0 bg-black pb-[14px] text-[8px] text-neutral-400"
                  }
                >
                  <div className={""}>Fees</div>
                  <div className={"mt-[7px] flex flex-row gap-[4px]"}>
                    <div
                      className={
                        "flex w-[55.23px] flex-col items-center gap-[4px]"
                      }
                    >
                      <div>
                        {/* {+feePercentage.toFixed(6)}% ={" "} */}
                        {+(feePercentage * usdPriceToken0).toFixed(2)}$
                      </div>
                      <div
                        className={
                          "h-[3px] w-full rounded-[1px] bg-neutral-400"
                        }
                      />
                      <div>Pool Fees</div>
                    </div>
                    <div
                      className={
                        "flex w-[138.88px] flex-col items-center gap-[4px]"
                      }
                    >
                      <div>$3.40</div>
                      <div
                        className={
                          "h-[3px] w-full rounded-[1px] bg-neutral-400"
                        }
                      />
                      <div>Network Fees</div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex flex-row justify-between">
            <div>Rewards</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
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
                </TooltipTrigger>
                <TooltipContent
                  side={"bottom"}
                  className={
                    "iridescent w-[221px] rounded-lg border-black pb-[14px] text-[8px] text-black"
                  }
                >
                  <div className={"mt-[12px]"}>Super Route</div>
                  <div className={"mt-[12px] flex flex-row"}>
                    <div className={"flex flex-col items-center"}>
                      <Token className={"size-[15px]"} />
                      <div>fUSDC</div>
                    </div>
                    <div className={"flex flex-1 flex-col justify-center"}>
                      <div
                        className={
                          "mb-3 w-full border border-dashed border-neutral-400"
                        }
                      />
                    </div>
                    <div className={"flex flex-col items-center"}>
                      <div className={"flex flex-row"}>
                        <Token className={"size-[15px]"} />
                        <Token className={"-ml-1 size-[15px]"} />
                      </div>
                      Fluid Pool
                    </div>
                    <div className={"flex flex-1 flex-col justify-center"}>
                      <div
                        className={
                          "mb-3 w-full border border-dashed border-neutral-400"
                        }
                      />
                    </div>
                    <div className={"flex flex-col items-center"}>
                      <Token className={"size-[15px]"} />
                      <div>{token0.name}</div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex flex-row justify-between">
            <div>Route</div>
            <div>Super Route</div>
          </div>
        </div>

        <div
          className={cn(
            "mt-[15px] h-[210px] w-[318px] rounded-lg bg-black px-[11px] pt-[16px] text-xs text-white md:w-[392px]",
            {
              "h-[120px]": !showBoostIncentives,
            },
          )}
        >
          <div>Yield Breakdown</div>

          <div className="mt-[14px] flex w-full flex-col gap-[5px] pl-[5px] text-2xs">
            <div className="flex flex-row justify-between">
              <div>Pool Fees</div>

              <div className={"flex flex-row items-center"}>
                <Token />
                <Token className={"-ml-1 mr-1"} />
                {feePercentage.toFixed(6)}%
              </div>
            </div>

            {showBoostIncentives && (
              <>
                <div className="flex flex-row justify-between">
                  <div>Liquidity Boosts</div>

                  <div className={"flex flex-row items-center"}>
                    <Token />
                    <Token className={"-ml-1 mr-1"} />
                    $0.20 - $13.06
                  </div>
                </div>

                <div className="flex flex-row justify-between">
                  <div>Super Boosts</div>

                  <div className={"flex flex-row items-center"}>
                    <Token />
                    <Token className={"-ml-1 mr-1"} />
                    $5.91 - $8.34
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={"mt-[20px] flex flex-row justify-between pl-[5px]"}>
            <div className="font-medium">Total</div>

            <Badge
              variant="iridescent"
              className="h-[17px] px-1 text-2xs font-normal"
            >
              <Token />
              <Token className={"-ml-1"} />
              <Token className={"-ml-1 mr-1"} />
              <div>???</div>
            </Badge>
          </div>

          {showBoostIncentives && (
            <>
              <div className="mt-[20px] flex flex-row gap-1 text-2xs">
                <div className="flex w-[3%] flex-col">
                  <div>3%</div>
                  <div className="h-1 w-full rounded bg-white"></div>
                </div>

                <div className="flex w-[7%] flex-col items-center">
                  <div>7%</div>
                  <div className="h-1 w-full rounded bg-white"></div>
                </div>

                <div className="flex w-[30%] flex-col items-center">
                  <div>30%</div>
                  <div className="h-1 w-full rounded bg-white"></div>
                  <div>Super Boosts</div>
                </div>

                <div className="flex w-3/5 flex-col items-center">
                  <div>60%</div>
                  <div className="iridescent h-1 w-full rounded"></div>
                  <div>Utility Boosts</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-[20px] w-[318px] md:hidden">
          <Index onSlideComplete={onSubmit}>
            <div className="text-xs">Stake</div>
          </Index>
        </div>

        <div className="mt-[20px] hidden md:inline-flex md:w-[392px]">
          {address ? (
            isCorrectChain ? (
              <Button
                className="w-full"
                onClick={onSubmit}
                disabled={!token0Amount}
              >
                Stake
              </Button>
            ) : (
              <Button
                className="w-full"
                variant={"destructiveBorder"}
                onClick={() => open({ view: "Networks" })}
                disabled={!token0Amount}
              >
                Wrong Network
              </Button>
            )
          ) : (
            <Button className={"w-full"} onClick={() => open()}>
              Connect Wallet
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
