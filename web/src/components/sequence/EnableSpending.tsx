"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Circles from "@/assets/icons/circles.svg";
import { useChainId, useChains } from "wagmi";
import { Hash } from "viem";
import { motion } from "framer-motion";

interface EnableSpendingProps {
  tokenName: string;
  transactionHash?: Hash;
}

export const EnableSpending = ({
  tokenName,
  transactionHash,
}: EnableSpendingProps) => {
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
            size={"sm"}
            className="h-[26px] w-[36px] text-2xs"
          >
            Esc
          </Button>
        </div>
        <Image
          src={require("@/assets/gifs/unlock.gif")}
          alt={"unlock"}
          className={"mt-[18px] size-[56px] md:mt-[51px]"}
        />
        <div className="mt-[13px] w-[155px] text-center text-sm md:mt-[16px]">
          Enable spending {tokenName}{" "}
        </div>

        {transactionHash && chain?.blockExplorers?.default && (
          <a
            className="mt-[22px] cursor-pointer text-3xs underline"
            rel="noopener noreferrer"
            target="_blank"
            href={`${chain.blockExplorers.default.url}/tx/${transactionHash}`}
          >
            View transaction on {chain.blockExplorers.default.name}
          </a>
        )}

        <Circles
          className={"mt-[24px] h-[5.357px] w-[36.357px] md:mt-[61px]"}
        />
      </motion.div>
    </div>
  );
};
