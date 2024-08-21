import { useStakeWelcomeBackStore } from "@/stores/useStakeWelcomeBackStore";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { motion } from "framer-motion";
import { CampaignBanner } from "@/components/CampaignBanner";
import { Button } from "@/components/ui/button";
import ProfilePicture from "@/assets/icons/profile-picture.svg";
import IridescentToken from "@/assets/icons/iridescent-token.svg";
import { Badge } from "@/components/ui/badge";
import Token from "@/assets/icons/token.svg";

export const WelcomeModal = () => {
  const { welcome, setWelcome, setYieldBreakdown } = useStakeWelcomeBackStore();

  return (
    <>
      <AlertDialog.Root open={welcome}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-30 bg-black/80 md:bg-black/50">
            <AlertDialog.Content
              className="z-50 mt-[200px]"
              aria-label="welcome back modal"
            >
              <div className="flex flex-col items-center gap-2 px-4">
                <motion.div
                  className="w-full max-w-[394px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CampaignBanner />
                </motion.div>
                <div className="flex flex-col items-center">
                  <motion.div
                    layoutId="modal"
                    className="flex h-[21.8125rem] w-[19.875rem] flex-col items-center justify-between rounded-lg bg-black p-[10px] text-white drop-shadow-white md:h-[366px] md:w-[394px]"
                  >
                    <div className="flex w-full flex-row justify-between p-[4px]">
                      <div className="text-3xs md:text-2xs">
                        Earned since last login
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => setWelcome(false)}
                        size={"esc"}
                      >
                        Esc
                      </Button>
                    </div>

                    <div className="flex flex-col items-center gap-[8px]">
                      <ProfilePicture className={"size-[39px]"} />

                      <div className="md: w-full text-center text-2xs md:text-sm">
                        Welcome back!
                      </div>
                    </div>

                    <div className="mt-2 w-full pl-4 text-2xs md:text-xs">
                      {"Since you left you've earned:"}
                    </div>

                    <div className="flex w-full flex-col gap-1 px-4 pl-8">
                      <div className="flex flex-row justify-between text-3xs md:text-2xs">
                        <div>Pool Fees</div>

                        <div className="flex flex-row items-center gap-1">
                          <IridescentToken className="size-4" />
                          <div>$21.72</div>
                        </div>
                      </div>

                      <div className="flex flex-row justify-between text-3xs md:text-2xs">
                        <div>Liquidity Boosts</div>

                        <div className="flex flex-row items-center gap-1">
                          <div className="flex flex-row">
                            <IridescentToken className="size-4" />
                            <IridescentToken className="-ml-2 size-4" />
                          </div>
                          <div>$13.06</div>
                        </div>
                      </div>

                      <div className="flex flex-row justify-between text-3xs md:text-2xs">
                        <div>Super Boosts</div>
                        <div className="flex flex-row items-center gap-1">
                          <IridescentToken className="size-4" />
                          <div>$8.34</div>
                        </div>
                      </div>

                      <div className="flex flex-row justify-between text-3xs md:text-2xs">
                        <div>Utility Boosts</div>
                        <div className="flex flex-row items-center gap-1">
                          <IridescentToken className="size-4" />
                          <div>$2.99</div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-row justify-between text-3xs font-semibold md:text-2xs">
                        <div>Total</div>
                        <Badge
                          variant="iridescent"
                          className="flex h-4 flex-row p-1 pl-0 text-3xs md:text-2xs"
                        >
                          <Token className="size-4" />
                          <Token className="-ml-2 size-4" />
                          <Token className="-ml-2 size-4" />
                          <Token className="-ml-2 size-4" />
                          $41.12
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 flex w-full flex-col items-center">
                      <Button
                        variant="iridescent"
                        className="h-[37px] w-full "
                        onClick={() => {
                          setWelcome(false);
                          setYieldBreakdown(true);
                        }}
                      >
                        Claim All Yield
                      </Button>
                      <div className="mt-[-10px]">
                        <Badge
                          className="h-4 border-2 border-black p-1 pl-0.5 text-3xs"
                          variant="iridescent"
                        >
                          <IridescentToken />
                          <IridescentToken />
                          $920.12
                        </Badge>
                      </div>
                    </div>
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
