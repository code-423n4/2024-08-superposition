"use client";

import { Badge } from "@/components/ui/badge";
import ArrowDown from "@/assets/icons/arrow-down.svg";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import SPNTest from "@/assets/icons/spn-test.svg";
import Ethereum from "@/assets/icons/ethereum.svg";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { cn } from "@/lib/utils";

export const NetworkSelection = () => {
  const { address } = useAccount();

  const { chains, switchChain } = useSwitchChain();
  const chainId = useChainId();

  const selectedChain = chains.find((chain) => chain.id === chainId);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="group">
        <Badge
          variant={address ? "default" : "invert"}
          className={
            "hidden h-[28px] rounded-2xl px-0.5 pr-2 transition-[width] group-data-[state=open]:rounded-b-none group-data-[state=open]:border-b-0 md:inline-flex"
          }
        >
          <div className="flex-col">
            <div className="flex flex-row items-center">
              <div className="mr-2">
                <SPNTest
                  className={cn("size-[20px] transition-none", {
                    invert: address,
                  })}
                />
              </div>
              <div className="text-nowrap">{selectedChain?.name}</div>
              <div className="ml-2 hidden w-0 transition-[width] group-hover:inline-flex group-hover:w-2 group-data-[state=open]:inline-flex group-data-[state=open]:w-2">
                <ArrowDown
                  width={10}
                  height={6}
                  className={cn({
                    invert: address,
                  })}
                />
              </div>
            </div>
          </div>
        </Badge>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "-mt-2 flex w-[--radix-dropdown-menu-trigger-width] flex-col gap-0.5 rounded-2xl rounded-t-none border border-t-0 border-black p-2 text-xs",
            {
              "bg-white": !address,
              "bg-black text-white": address,
            },
          )}
        >
          {chains.map(
            (chain) =>
              chain.id !== chainId && (
                <DropdownMenu.Item
                  key={chain.id}
                  className="flex cursor-pointer flex-row items-center gap-1 p-1 text-xs"
                  onSelect={() => switchChain({ chainId: chain.id })}
                >
                  <Ethereum
                    className={cn("size-[12px]", {
                      invert: address,
                    })}
                  />{" "}
                  {chain.name}
                </DropdownMenu.Item>
              ),
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
