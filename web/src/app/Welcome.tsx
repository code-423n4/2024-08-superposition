"use client";

import { Button } from "@/components/ui/button";
import { useWelcomeStore } from "@/stores/useWelcomeStore";
import Token from "@/assets/icons/token.svg";

/**
 * Overlays the welcome screen on top of the app
 */
export const Welcome = () => {
  const { setWelcome, welcome } = useWelcomeStore();

  if (!welcome) return null;

  return (
    <>
      <div
        className="absolute top-[40%] z-50 w-full"
        data-test="welcome-component"
      >
        <div className="flex flex-col items-center justify-around gap-10 bg-white">
          <div className="mt-10 flex flex-row items-center gap-1 text-3xl font-medium">
            Think{" "}
            <div className="mx-1 rounded-md bg-black p-1 px-2 text-white">
              inside
            </div>{" "}
            the box.
          </div>

          {/* this text is different on desktop and mobile */}
          {/* mobile */}
          <div className="inline-flex md:hidden">
            Earn rewards on every trade on the first DeFi <br />
            Layer-3 focused on incentives and order flow.
          </div>
          {/* desktop */}
          <div className="hidden text-center md:inline-flex">
            The First AMM That Pays You To Use It. <br />
            Earn Rewards On Every Trade!
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-row flex-wrap items-center justify-center gap-4">
              <div className="group h-[35px] rounded-full border border-black p-3 transition-[height] hover:h-[60px] hover:bg-black hover:text-white ">
                <div className="flex h-full w-[320px] flex-col items-center justify-center gap-1 group-hover:w-[365px]">
                  <div className="text-sm group-hover:text-base">
                    <a
                      href="https://docs.superposition.so/superposition-testnet/super-layer/super-assets"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      ⛽️ Gas Rebates and Negative Fees for traders
                    </a>
                  </div>
                  <div className="hidden text-xs text-gray-1 group-hover:inline-flex">
                    Less Gas, More Cash.{" "}
                    <span className="ml-1 hidden cursor-pointer underline md:inline-flex">
                      <a
                        href="https://docs.superposition.so/superposition-testnet/super-layer/super-assets"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Learn More {"->"}
                      </a>
                    </span>
                  </div>
                </div>
              </div>

              <div className="group h-[35px] rounded-full border border-black p-1 px-3 transition-[height] hover:h-[60px] hover:bg-black hover:text-white ">
                <div className="flex h-full w-[345px] flex-col items-center justify-center gap-1 group-hover:w-[400px]">
                  <div className="flex flex-row items-center gap-1 text-sm group-hover:text-base">
                    <div className="group-hover:invert">
                      <Token
                        className={"size-[18px] group-hover:size-[24px]"}
                      />
                    </div>
                    <a
                      href="https://docs.superposition.so/superposition-testnet/super-layer/universal-shared-liquidity/longtail-amm-specs"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      $29,123 Trader Rewards available on every swap
                    </a>
                  </div>
                  <div className="hidden text-xs text-gray-1 group-hover:inline-flex ">
                    Get rewarded for every transaction you make.{" "}
                    <a
                      href="https://docs.superposition.so/superposition-testnet/super-layer/universal-shared-liquidity/longtail-amm-specs"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span className="ml-1 hidden cursor-pointer underline md:inline-flex">
                        Learn More {"->"}
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-row justify-center">
              <div className="group h-[35px] rounded-full border border-black p-1 px-3 transition-[height] hover:h-[60px] hover:bg-black hover:text-white ">
                <div className="flex h-full w-[305px] flex-col items-center justify-center gap-1 group-hover:w-[350px]">
                  <div className="text-sm group-hover:text-base">
                    <a
                      href="https://docs.superposition.so/superposition-testnet/super-layer/universal-shared-liquidity/longtail-amm-specs"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Earn Higher Revenue with Utility Booster
                    </a>
                  </div>
                  <div className="hidden text-xs text-gray-1 group-hover:inline-flex">
                    Earn easy and earn big.{" "}
                    <a
                      href="https://docs.superposition.so/superposition-testnet/super-layer/universal-shared-liquidity/longtail-amm-specs"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span className="ml-1 hidden cursor-pointer underline md:inline-flex">
                        Learn More {"->"}
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button onClick={() => setWelcome(false)} className="shine">
              <span className="iridescent-text">Get Started</span>
            </Button>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href={
                "https://docs.superposition.so/longtail-amm/introducing-longtail"
              }
            >
              <Button variant="link">Learn more {"->"}</Button>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
