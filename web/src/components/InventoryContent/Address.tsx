import CopyToClipboard from "react-copy-to-clipboard";
import { Check } from "lucide-react";
import { useAccount, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const Address = () => {
  const { address } = useAccount();
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
  });

  const [copied, setCopied] = useState(false);

  /**
   * When copied is set to true this will reset
   * the state after 2 seconds
   */
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (copied) {
      timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [copied]);

  return (
    <div
      className={cn(
        "ml-1 flex h-4 cursor-pointer flex-col items-center justify-center rounded-[3px] bg-white px-1 transition-all hover:scale-110",
        {
          "border border-green-400 bg-black": copied,
        },
      )}
    >
      <CopyToClipboard
        text={ensName ?? address ?? ""}
        onCopy={() => setCopied(true)}
      >
        <div className="flex items-center justify-center gap-1">
          {copied ? (
            <>
              <Check className="h-[8.54px] w-2 text-green-400" />
              <div className={"text-[10px]"}>Copied</div>
            </>
          ) : (
            <>
              <div className="relative h-[8.54px] w-2">
                <div className="absolute left-0 top-0 h-[6.54px] w-[5.90px] rounded-[0.73px] border border-stone-900" />
                <div className="absolute left-[2.10px] top-[2px] h-[6.54px] w-[5.90px] rounded-[0.73px] border border-stone-900 bg-gray-200" />
              </div>
              <div className="text-[10px] text-black">
                {ensName ? (
                  ensName
                ) : (
                  <>
                    {address?.slice(0, 5)} ... {address?.slice(-3)}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </CopyToClipboard>
    </div>
  );
};
