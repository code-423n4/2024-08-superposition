"use client";

import { Button } from "@/components/ui/button";
import Circles from "@/assets/icons/circles.svg";
import Image from "next/image";
import Token from "@/assets/icons/token.svg";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useChainId, useChains } from "wagmi";

export interface ConfirmProps {
  text?: string;
  fromAsset: {
    amount: string;
    symbol: string;
  };
  toAsset: {
    amount: string;
    symbol: string;
  };
  transactionHash?: string;
}

export default function Confirm({
  text = "Swap",
  transactionHash,
  fromAsset,
  toAsset,
}: ConfirmProps) {
  const router = useRouter();
  const chains = useChains();
  const chainId = useChainId();

  const chain = chains.find((chain) => chain.id === chainId);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        layoutId={"modal"}
        className="flex h-[234px] w-[266px] flex-col items-center rounded-lg bg-black p-2 text-white md:h-[328px] md:w-[393px]"
      >
        <div className="flex w-full flex-row justify-end">
          <Button
            variant="secondary"
            size={"esc"}
            onClick={() => router.back()}
          >
            Esc
          </Button>
        </div>
        <Image
          src={require("@/assets/gifs/processing.gif")}
          alt={"processing"}
          className="size-[59px] md:size-[86px]"
        />
        <div className="mt-[13px] w-[173px] text-center text-sm md:mt-[44px]">
          Confirm {text}
        </div>
        <div className="mt-[13px] flex flex-row items-center gap-1 text-2xs md:mt-[29px]">
          <Token />
          <div>
            {fromAsset.amount} {fromAsset.symbol} {"->"}
          </div>
          <Token />
          <div>
            {toAsset.amount} {toAsset.symbol}
          </div>
        </div>
        <div className="mt-[12px] cursor-pointer text-3xs underline md:hidden">
          {transactionHash && chain?.blockExplorers?.default && (
            <a
              className="mt-[12px] cursor-pointer text-3xs underline md:mt-[26px]"
              rel="noopener noreferrer"
              target="_blank"
              href={`${chain.blockExplorers.default.url}/tx/${transactionHash}`}
            >
              View transaction on Explorer
            </a>
          )}
        </div>
        <Circles
          className={"mt-[30px] h-[5.357px] w-[36.357px] md:mt-[40px]"}
        />
      </motion.div>
    </div>
  );
}
