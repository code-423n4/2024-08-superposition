"use client";

import { Badge } from "@/components/ui/badge";
import SPNTest from "@/assets/icons/spn-test.svg";
import ArrowDown from "@/assets/icons/arrow-down.svg";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Ethereum from "@/assets/icons/ethereum.svg";
import { useChainId, useSwitchChain } from "wagmi";

/**
 * Shows a dropdown menu with links to switch the network.
 */
export const MobileNetworkSelection = () => {
  const { chains, switchChain } = useSwitchChain();

  const chainId = useChainId();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="group">
        <Badge
          variant="invert"
          className={
            "w-14 cursor-pointer rounded-2xl border-primary-foreground px-0.5 pr-2 invert transition-[width] group-data-[state=open]:w-[105px] group-data-[state=open]:rounded-b-none group-data-[state=open]:border-b-0 md:hidden"
          }
        >
          <div className={"w-full flex-col"}>
            <div className="flex w-full flex-row items-center justify-between">
              <div className="mr-2">
                <SPNTest height={30} width={30} />
              </div>
              <div className={"w-2"}>
                <ArrowDown width={10} height={6} />
              </div>
            </div>
          </div>
        </Badge>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="z-50 -mt-2 flex w-[105px] flex-col gap-0.5 rounded-2xl rounded-t-none bg-black p-2 text-xs text-white">
          {chains.map(
            (chain) =>
              chain.id !== chainId && (
                <DropdownMenu.Item
                  key={chain.id}
                  className="flex cursor-pointer flex-row items-center gap-1 p-1 text-xs"
                  onSelect={() => switchChain({ chainId: chain.id })}
                >
                  <Ethereum className={"size-[12px]"} /> {chain.name}
                </DropdownMenu.Item>
              ),
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
