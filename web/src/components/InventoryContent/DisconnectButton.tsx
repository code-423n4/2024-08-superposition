import { cn } from "@/lib/utils";
import Disconnect from "@/assets/icons/disconnect.svg";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useDetectClickOutside } from "react-detect-click-outside";
import { useDisconnect } from "wagmi";

export const DisconnectButton = () => {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const ref = useDetectClickOutside({
    onTriggered: () => setConfirmDisconnect(false),
  });

  const { disconnect } = useDisconnect();

  return (
    <Badge
      ref={ref}
      variant="secondary"
      className={cn(
        "h-[25px] w-[25px] cursor-pointer items-center gap-1 px-1 transition-all",
        {
          "bg-transparent": !confirmDisconnect,
          "w-[95px] ": confirmDisconnect,
        },
      )}
      onClick={() => {
        if (confirmDisconnect) {
          disconnect();
        } else {
          setConfirmDisconnect(true);
        }
      }}
    >
      <Disconnect
        className={cn("size-[15px]", {
          invert: confirmDisconnect,
        })}
      />
      {confirmDisconnect && "Disconnect"}
    </Badge>
  );
};
