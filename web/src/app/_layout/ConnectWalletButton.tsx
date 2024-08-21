"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePathname, useRouter } from "next/navigation";
import { InventorySheet } from "@/components/InventorySheet";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";

export const ConnectWalletButton = () => {
  const { address } = useAccount();
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
  });

  const { isLtSm } = useMediaQuery();

  const router = useRouter();
  const pathname = usePathname();

  const { open } = useWeb3Modal();

  if (address && !isLtSm) {
    return <InventorySheet />;
  }

  if (address && isLtSm && pathname === "/swap/inventory") {
    return (
      <div className="flex flex-row items-center justify-center gap-[10px] rounded">
        <Button
          size={"sm"}
          className={"h-[28px]"}
          onClick={() => router.back()}
        >
          X Close
        </Button>
        <Image
          src={require("@/assets/profile-picture.png")}
          alt={"profile picture"}
          className={"size-[28px] rounded"}
        />
      </div>
    );
  }

  if (address && isLtSm) {
    return (
      <div className="flex flex-row items-center justify-center gap-[10px] rounded">
        <div
          onClick={() => router.push("/swap/inventory")}
          className="cursor-pointer text-nowrap rounded p-1 text-right text-xs font-semibold text-black transition-all hover:bg-black hover:text-base hover:text-white"
        >
          {ensName ? (
            ensName
          ) : (
            <>
              {address.slice(0, 5)} ... {address.slice(-3)}
            </>
          )}
        </div>
        <Image
          src={require("@/assets/profile-picture.png")}
          alt={"profile picture"}
          className={"size-[28px] rounded"}
        />
      </div>
    );
  }

  return (
    <Button
      size="sm"
      color="light"
      className="mb-1 h-[26px] text-sm"
      onClick={() => open()}
    >
      Connect Wallet
    </Button>
  );
};
