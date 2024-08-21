import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Success from "@/assets/icons/success.gif";
import { useStakeWelcomeBackStore } from "@/stores/useStakeWelcomeBackStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export const YieldBreakdownClaimedDrawer = () => {
  const { yieldBreakdownClaimed, setYieldBreakdownClaimed } =
    useStakeWelcomeBackStore();

  const { isLtSm } = useMediaQuery();

  return (
    <Drawer
      open={yieldBreakdownClaimed && isLtSm}
      onOpenChange={setYieldBreakdownClaimed}
    >
      <DrawerContent>
        <div className="flex flex-row items-center justify-between p-[14px]">
          <div className="text-2xs">All Yield Claimed</div>
          <DrawerClose>
            <Button
              size="sm"
              variant="secondary"
              className="h-[21px] w-[32px] text-3xs"
            >
              Esc
            </Button>
          </DrawerClose>
        </div>
        <div className="flex flex-col items-center">
          <Image src={Success} alt="success" className="size-[52px]" />
          <div className="mt-[11px] text-xl">All Yield Claimed!</div>
          <div className="mt-[17px] text-3xs">
            You’ve successfully claimed all available yields from your pools!
          </div>

          <div className="mt-[26px] flex w-full flex-row gap-2 p-[13px]">
            <Button variant="outline" className="flex-1 text-2xs">
              Add to Your Wallet
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-2xs"
              onClick={() => {
                setYieldBreakdownClaimed(false);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
