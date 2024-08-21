import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import { InventoryContent } from "@/components/InventoryContent";
import { useInventorySheet } from "@/stores/useInventorySheet";
import { useAccount, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";

export const InventorySheet = () => {
  const { isOpen, setIsOpen } = useInventorySheet();

  const { address } = useAccount();

  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-row items-center justify-center gap-[10px] rounded">
        <SheetTrigger asChild>
          <div className="cursor-pointer text-nowrap rounded p-1 text-right text-xs font-semibold text-black transition-all hover:bg-black hover:text-base hover:text-white">
            {ensName ? (
              ensName
            ) : (
              <>
                {address?.slice(0, 5)} ... {address?.slice(-3)}
              </>
            )}
          </div>
        </SheetTrigger>
        <Image
          src={require("@/assets/profile-picture.png")}
          alt={"profile picture"}
          className={"size-[28px] rounded"}
        />
      </div>

      <SheetContent className="my-2 max-h-screen overflow-y-auto rounded-lg border-0 bg-black text-white">
        <InventoryContent />
      </SheetContent>
    </Sheet>
  );
};
