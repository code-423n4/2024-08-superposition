import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { usdFormat } from "@/lib/usdFormat";
import { Badge } from "@/components/ui/badge";
import { useStakeWelcomeBackStore } from "@/stores/useStakeWelcomeBackStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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

export const YieldBreakdownDrawer = () => {
  const { yieldBreakdown, setYieldBreakdown, setYieldBreakdownClaimed } =
    useStakeWelcomeBackStore();

  const { isLtSm } = useMediaQuery();

  return (
    <Drawer open={yieldBreakdown && isLtSm} onOpenChange={setYieldBreakdown}>
      <DrawerContent>
        <div className="flex flex-row items-center justify-between p-[14px]">
          <div className="text-2xs">Yield Breakdown</div>
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
        <div className="mx-[29px] mb-[32px] mt-[22px] flex flex-col gap-[15px]">
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
        <div className="mb-[29px] flex flex-col items-center">
          <div className="text-3xs text-gray-2 underline">
            ⚠️ ️Claiming Yield will withdraw currently available yield for you.
          </div>
        </div>
        <div className="flex w-full flex-col px-[13px] pb-[13px]">
          <DrawerClose
            onClick={() => {
              setYieldBreakdownClaimed(true);
            }}
          >
            <Button className="w-full text-2xs" variant="secondary">
              Claim Yield
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
