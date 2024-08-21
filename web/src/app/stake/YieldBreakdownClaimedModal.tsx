import { useStakeWelcomeBackStore } from "@/stores/useStakeWelcomeBackStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Success from "@/assets/icons/success.gif";

export const YieldBreakdownClaimedModal = () => {
  const { yieldBreakdownClaimed, setYieldBreakdownClaimed } =
    useStakeWelcomeBackStore();

  const { isLtSm } = useMediaQuery();

  return (
    <>
      <AlertDialog.Root open={yieldBreakdownClaimed && !isLtSm}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-30 bg-black/80 md:bg-black/50">
            <AlertDialog.Content
              className="z-50 mt-[200px]"
              aria-label="yield breakdown claimed modal"
            >
              <div className="flex flex-col items-center gap-2 px-4">
                <div className="flex flex-col items-center">
                  <motion.div
                    layoutId="modal"
                    className="flex w-[400px] flex-col items-center justify-between rounded-lg bg-black p-[10px] text-white drop-shadow-white"
                  >
                    <motion.div
                      layout
                      className="flex w-full flex-col items-center justify-between"
                    >
                      <div className="flex w-full flex-row justify-between p-[4px]">
                        <div className="text-3xs md:text-2xs">
                          Yield Breakdown
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => setYieldBreakdownClaimed(false)}
                          size={"esc"}
                        >
                          Esc
                        </Button>
                      </div>

                      <Image
                        src={Success}
                        alt="success"
                        className="size-[52px]"
                      />
                      <div className="mt-[11px] text-xl">
                        All Yield Claimed!
                      </div>
                      <div className="mt-[17px] text-3xs">
                        You’ve successfully claimed all available yields from
                        your pools!
                      </div>

                      <div className="mt-[26px] flex w-full flex-row gap-2">
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
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Overlay>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
};
