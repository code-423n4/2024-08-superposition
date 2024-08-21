"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Hash } from "viem";
import { useChainId, useChains } from "wagmi";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface FailProps {
  text: string;
  transactionHash?: Hash;
  onDone?: () => void;
}

export const Fail = ({ text, transactionHash, onDone }: FailProps) => {
  const router = useRouter();
  const chains = useChains();
  const chainId = useChainId();

  const chain = chains.find((chain) => chain.id === chainId);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        layoutId={"modal"}
        className="absolute hidden h-[354px] w-[426px] bg-red-500 opacity-50 mix-blend-darken blur-[163px] md:inline"
      />

      <div className="z-10 flex h-[248.914px] w-[266px] flex-col items-center rounded-lg bg-black p-2 text-white md:h-[328px] md:w-[393px]">
        <div className="flex w-full flex-row justify-end">
          <Button
            variant="secondary"
            size={"esc"}
            onClick={() => (onDone ?? router.back)()}
          >
            Esc
          </Button>
        </div>
        <Image
          src={require("@/assets/gifs/fail.gif")}
          alt={"unlock"}
          className={"mt-[20px] size-[59px] md:mt-[64px]"}
        />
        <div className="mt-[9px] w-[155px] text-center text-sm md:mt-[7px]">
          Failed
        </div>
        <div className={"mt-[13px] max-w-[80%] text-2xs text-gray-2"}>
          {text}
        </div>
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
        <div className="w-full md:p-2">
          <Button
            variant={"secondary"}
            className="mt-[18px] h-[29px] w-full md:mt-[42px] md:h-[35px]"
            onClick={() => (onDone ?? router.back)()}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
