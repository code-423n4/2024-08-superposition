"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { FaFaucet } from "react-icons/fa";
import ArrowDown from "@/assets/icons/arrow-down.svg";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * Shows a dropdown menu with links to the faucets.
 */
export const FaucetDropdown = () => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="group">
        <Badge
          className={
            "h-[28px] rounded-2xl px-0.5 pr-2 transition-[width] group-data-[state=open]:rounded-b-none group-data-[state=open]:border-b-0 md:inline-flex"
          }
        >
          <div className="flex-col">
            <div className="flex flex-row items-center">
              <div className="mx-2">
                <FaFaucet />
              </div>
              <div className="text-nowrap">Faucets</div>
              <div className="ml-2 hidden w-0 transition-[width] group-hover:inline-flex group-hover:w-2 group-data-[state=open]:inline-flex group-data-[state=open]:w-2">
                <ArrowDown width={10} height={6} className={"invert"} />
              </div>
            </div>
          </div>
        </Badge>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "-mt-2 flex w-[--radix-dropdown-menu-trigger-width] flex-col gap-0.5 rounded-2xl rounded-t-none border border-t-0 border-black bg-black p-2 text-xs text-white",
          )}
        >
          <a
            rel="noopener noreferrer"
            target="_blank"
            href="https://wspn.long.so/"
          >
            <DropdownMenu.Item className="flex cursor-pointer flex-row items-center gap-1 p-1 text-xs">
              Wrap SPN
            </DropdownMenu.Item>
          </a>
          <a
            rel="noopener noreferrer"
            target="_blank"
            href="https://faucet.superposition.so"
          >
            <DropdownMenu.Item className="flex cursor-pointer flex-row items-center gap-1 p-1 text-xs">
              SPN faucet
            </DropdownMenu.Item>
          </a>
          <a
            rel="noopener noreferrer"
            target="_blank"
            href="https://faucet.quicknode.com/arbitrum/sepolia"
          >
            <DropdownMenu.Item className="flex cursor-pointer flex-row items-center gap-1 p-1 text-xs">
              Arbitrum Sepolia ETH faucet
            </DropdownMenu.Item>
          </a>
          {/*
          <a rel="noopener noreferrer" target="_blank" href="https://wspn.long.so">
            <DropdownMenu.Item className="flex cursor-pointer flex-row items-center gap-1 p-1 text-xs">
              Create WSPN
            </DropdownMenu.Item>
          </a>
          */}
          <a
            rel="noopener noreferrer"
            target="_blank"
            href="https://sepolia.arbiscan.io/address/0x980b62da83eff3d4576c647993b0c1d7faf17c73#writeProxyContract#F5"
          >
            <DropdownMenu.Item className="flex cursor-pointer flex-row items-center gap-1 p-1 text-xs">
              Arbitrum Sepolia Create WETH
            </DropdownMenu.Item>
          </a>
          <a
            rel="noopener noreferrer"
            target="_blank"
            href="https://faucet.circle.com/"
          >
            <DropdownMenu.Item className="flex cursor-pointer flex-row items-center gap-1 p-1 text-xs">
              Arbitrum Sepolia USDC faucet
            </DropdownMenu.Item>
          </a>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
