import { useStakeWelcomeBackStore } from "@/stores/useStakeWelcomeBackStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usdFormat } from "@/lib/usdFormat";
import { Badge } from "@/components/ui/badge";
import { nanoid } from "nanoid";
import Token from "@/assets/icons/token.svg";
import Ethereum from "@/assets/icons/ethereum.svg";

const yieldData = [
  {
    id: nanoid(),
    token: "fUSDC",
    amount: 350,
    usdAmount: 350,
    icon: <Token className="size-[20px]" />,
  },
  {
    id: nanoid(),
    token: "ETH",
    amount: 0.000432958512,
    usdAmount: 350,
    icon: <Ethereum className="size-[20px] invert" />,
  },
  {
    id: nanoid(),
    token: "ETH",
    amount: 0.000432958512,
    usdAmount: 350,
    icon: <Ethereum className="size-[20px] invert" />,
  },
  {
    id: nanoid(),
    token: "ETH",
    amount: 0.000432958512,
    usdAmount: 350,
    icon: <Ethereum className="size-[20px] invert" />,
  },
  {
    id: nanoid(),
    token: "ETH",
    amount: 0.000432958512,
    usdAmount: 350,
    icon: <Ethereum className="size-[20px] invert" />,
  },
  {
    id: nanoid(),
    token: "ETH",
    amount: 0.000432958512,
    usdAmount: 350,
    icon: <Ethereum className="size-[20px] invert" />,
  },
  {
    id: nanoid(),
    token: "ETH",
    amount: 0.000432958512,
    usdAmount: 350,
    icon: <Ethereum className="size-[20px] invert" />,
  },
];

export const YieldBreakdownModal = () => {
  const { yieldBreakdown, setYieldBreakdown, setYieldBreakdownClaimed } =
    useStakeWelcomeBackStore();

  const { isLtSm } = useMediaQuery();

  return (
    <>
      <AlertDialog.Root open={yieldBreakdown && !isLtSm}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-30 overflow-y-auto bg-black/80 md:bg-black/50">
            <AlertDialog.Content
              className="z-50 mb-[30px] mt-[200px]"
              aria-label="yield breakdown modal"
            >
              <div className="flex flex-col items-center gap-2 px-4">
                <div className="flex flex-col items-center">
                  <motion.div
                    layoutId="modal"
                    className="flex w-[400px] flex-col items-center justify-between rounded-lg bg-black p-[10px] text-white drop-shadow-white"
                  >
                    <div className="flex w-full flex-row justify-between p-[4px]">
                      <div className="text-3xs md:text-2xs">
                        Yield Breakdown
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => setYieldBreakdown(false)}
                        size={"esc"}
                      >
                        Esc
                      </Button>
                    </div>

                    <div className="mt-[26px] flex flex-col items-center gap-[4px]">
                      <div className="text-3xs">
                        Total Claimable Amount in{" "}
                        <span className="font-medium underline">$USD</span>
                      </div>
                      <div className="text-3xl">$1,433.35</div>
                    </div>

                    <div className="mt-[21px] text-center text-2xs text-gray-2">
                      Yield breakdown of tokens at current market price:
                    </div>

                    <div className="mt-[20px] flex w-full flex-col gap-[15px] px-[35px]">
                      {yieldData.map((y) => (
                        <div
                          className="flex flex-row items-center justify-between"
                          key={y.id}
                        >
                          <div className="flex flex-row items-center gap-[6px]">
                            {y.icon}

                            <div className="flex flex-col">
                              <div>{y.amount}</div>
                              <div className="text-2xs text-gray-2">
                                ({usdFormat(y.usdAmount)})
                              </div>
                            </div>
                          </div>

                          <Badge variant="outline" className="text-white">
                            {y.token}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    <div className="mt-[32px] flex flex-col items-center">
                      <div className="text-3xs text-gray-2 underline">
                        ⚠️ ️Claiming Yield will withdraw currently available
                        yield for you.
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      className={"mt-[25px] h-[37px] w-full text-xs"}
                      onClick={() => {
                        setYieldBreakdown(false);
                        setYieldBreakdownClaimed(true);
                      }}
                    >
                      Confirm Claim
                    </Button>
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
