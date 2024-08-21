"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import IridescentToken from "@/assets/icons/token-iridescent.svg";
import { AllAssetsTable } from "@/app/swap/explore/_AllAssetsTable/AllAssetsTable";
import { columns } from "@/app/swap/explore/_AllAssetsTable/columns";
import { Token, fUSDC, getTokenFromAddress } from "@/config/tokens";
import { useSwapStore } from "@/stores/useSwapStore";
import { graphql, useFragment } from "@/gql";
import { useGraphqlGlobal } from "@/hooks/useGraphql";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useEffect, useMemo, useState } from "react";
import { Hash } from "viem";
import {
  mockHighestRewarders,
  mockSwapExploreAssets,
} from "@/demoData/swapExploreAssets";
import { getBalance } from "wagmi/actions";
import { useAccount } from "wagmi";
import { config } from "@/config";
import { getFormattedStringFromTokenAmount } from "@/lib/amounts";
import { SwapExploreFragmentFragment } from "@/gql/graphql";
import { useDetectClickOutside } from "react-detect-click-outside";
import { useHotkeys } from "react-hotkeys-hook";

const SwapExploreFragment = graphql(`
  fragment SwapExploreFragment on SeawaterPool {
    token {
      name
      symbol
      address
      decimals
    }
    price
  }
`);

const ExplorePage = () => {
  const router = useRouter();

  const { setToken1, setToken0 } = useSwapStore();

  const { address } = useAccount();

  const searchParams = useSearchParams();

  const ref = useDetectClickOutside({
    onTriggered: () => router.back(),
  });

  useHotkeys("esc", () => router.back(), { enableOnFormTags: ["INPUT"] });

  const token = searchParams.get("token") as "0" | "1";

  const { data, isLoading } = useGraphqlGlobal();

  const tokensData_ = useFragment(SwapExploreFragment, data?.pools);
  // fUSDC can be queried through GraphQL but it
  // still won't contain price, so create it manually
  const fUSDCData = useMemo(
    () =>
      ({
        token: fUSDC,
        price: "1",
      }) satisfies SwapExploreFragmentFragment,
    [fUSDC],
  );

  const tokensData = useMemo(
    () => [fUSDCData, ...(tokensData_ ?? [])],
    [fUSDCData, tokensData_],
  );

  const showMockData = useFeatureFlag("ui show demo data");

  const [tokenBalances, setTokenBalances] = useState<
    Array<{ amount: number; amountUSD: number }>
  >([]);

  useEffect(() => {
    (async () => {
      if (!tokensData || !address) return;

      const balances = await Promise.all(
        tokensData.map(async (token) => {
          const { value } = await getBalance(config, {
            address,
            token: token.token.address as `0x${string}`,
          });
          const amount = Number(
            getFormattedStringFromTokenAmount(
              value.toString(),
              token.token.decimals,
            ),
          );
          const amountUSD = amount * Number(token.price);
          return { amount, amountUSD };
        }),
      );
      setTokenBalances(balances);
    })();
  }, [address, tokensData]);

  const allAssetsData = useMemo(() => {
    if (showMockData) return mockSwapExploreAssets;

    // reformat the data to match the columns
    return (
      tokensData.map((token, i) => {
        const tokenFromAddress = getTokenFromAddress(token.token.address);
        return {
          symbol: token.token.symbol,
          address: token.token.address,
          name: token.token.name,
          amount: tokenBalances[i]?.amount ?? 0,
          amountUSD: tokenBalances[i]?.amountUSD ?? 0,
          icon: tokenFromAddress?.icon || "",
          token: tokenFromAddress,
        };
      }) ?? []
    );
  }, [showMockData, tokensData, tokenBalances]);

  return (
    <div className={"flex flex-col items-center overflow-y-auto"}>
      <motion.div
        layoutId={"modal"}
        ref={ref}
        className={
          "h-[509px] w-[325px] rounded-lg bg-black p-[10px] text-white md:h-[559px] md:w-[393px]"
        }
      >
        <div className={"flex flex-row items-center justify-between"}>
          <div className={"text-[10px] md:text-[12px]"}>Swap</div>
          <Button
            variant={"secondary"}
            size={"esc"}
            onClick={() => router.back()}
          >
            Esc
          </Button>
        </div>

        <div className={"mt-[16px] px-[10px]"}>
          <AllAssetsTable columns={columns} data={allAssetsData} token={token}>
            <div className={"mt-[24px]"}>
              <div className={"text-[10px] md:text-[12px]"}>
                Highest Rewarders
              </div>

              <div
                className={
                  "mt-[4px] flex h-[45px] flex-row items-center gap-[11px] overflow-x-auto md:h-[60px]"
                }
              >
                {/* TODO: add in highest rewarders */}
                {(showMockData ? mockHighestRewarders : []).map((rewarder) => (
                  <Badge
                    variant={"outline"}
                    className={
                      "relative h-[25.36px] cursor-pointer gap-1 pl-0.5"
                    }
                    key={rewarder.address}
                    onClick={() => {
                      if (token === "1") {
                        setToken1(rewarder.token);
                      } else {
                        setToken0(rewarder.token);
                      }

                      router.back();
                    }}
                  >
                    <IridescentToken className={"size-[20px]"} />
                    <div className={"iridescent-text text-sm"}>
                      {rewarder.symbol}
                    </div>
                    <div className="iridescent absolute -bottom-2 right-0 inline-flex h-[13px] flex-col items-end justify-center rounded-sm border border-stone-900 px-[3px] py-[1.50px]">
                      <div className="text-[8px]">2 days</div>
                    </div>
                  </Badge>
                ))}
              </div>
            </div>
          </AllAssetsTable>
        </div>
      </motion.div>
    </div>
  );
};

export default ExplorePage;
