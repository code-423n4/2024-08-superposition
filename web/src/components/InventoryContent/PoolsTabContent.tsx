import { cn } from "@/lib/utils";
import SegmentedControl from "@/components/ui/segmented-control";
import { DataTable } from "@/components/InventoryContent/DataTable";
import { columns as yieldColumns } from "@/components/InventoryContent/columns";
import { yieldData } from "@/components/InventoryContent/data/yieldData";
import { myPositionsData as mockMyPositionsData } from "@/components/InventoryContent/data/myPositionsData";
import { useMemo, useRef, useState } from "react";
import { MyYieldUnclaimed } from "@/components/InventoryContent/MyYieldUnclaimed";
import { Position } from "@/components/InventoryContent/Position";
import { graphql, useFragment } from "@/gql";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useGraphqlUser } from "@/hooks/useGraphql";

const MyPositionsInventoryWalletFragment = graphql(`
  fragment MyPositionsInventoryWalletFragment on Wallet {
    id
    positions {
      positions {
        id
        pool {
          token {
            name
            address
            symbol
          }
        }
      }
    }
  }
`);

export const PoolsTabContent = () => {
  const [yieldType, setYieldType] = useState<
    "unclaimed" | "all" | "historical"
  >("unclaimed");

  const showMockData = useFeatureFlag("ui show demo data");

  const { data } = useGraphqlUser();

  const walletData = useFragment(
    MyPositionsInventoryWalletFragment,
    data?.getWallet,
  );

  const myPositionsData = useMemo(() => {
    if (showMockData) {
      return mockMyPositionsData;
    }

    return (
      walletData?.positions?.positions.map((position) => ({
        id: position.id,
        pool: position.pool.token.name,
        yield: 0,
        position: "$0",
        liquidityRange: "0k - 0k",
      })) ?? []
    );
  }, [walletData?.positions?.positions, showMockData]);

  return (
    <div className={"flex flex-col items-center"}>
      <div
        className={cn(
          "mt-[22px] flex h-[270px] w-[284px] flex-col items-center overflow-y-auto rounded p-[10px] transition-colors md:w-[300px]",
          {
            "iridescent text-black": yieldType === "unclaimed",
            "border border-white text-white": yieldType !== "unclaimed",
          },
        )}
      >
        <div className={"flex w-full flex-row items-center justify-between"}>
          <div className={"text-[10px]"}>My Yield</div>

          <SegmentedControl
            name={"yield-type"}
            className={"text-[10px]"}
            variant={yieldType === "unclaimed" ? undefined : "secondary"}
            callback={(val) => setYieldType(val)}
            segments={[
              {
                label: "Unclaimed",
                value: "unclaimed" as const,
                ref: useRef(),
              },
              {
                label: "All",
                value: "all" as const,
                ref: useRef(),
              },
              {
                label: "Historical",
                value: "historical" as const,
                ref: useRef(),
              },
            ]}
          />
        </div>

        {yieldType === "unclaimed" && <MyYieldUnclaimed />}

        {yieldType === "all" && (
          <div className={"mt-[15px] flex w-full flex-col items-center"}>
            <DataTable columns={yieldColumns} data={yieldData} />
          </div>
        )}

        {yieldType === "historical" && (
          <div className={"mt-[15px] flex w-full flex-col items-center"}>
            <DataTable
              columns={yieldColumns}
              data={yieldData.filter((v) => v.status === "claimed")}
            />
          </div>
        )}
      </div>

      <div className={"w-full"}>
        <div className={"mt-[32px] flex flex-row justify-between"}>
          <div className={"text-[10px]"}>My Positions</div>
          <div className={"text-[10px]"}>
            <div>Sort By Yield</div>
          </div>
        </div>

        <div
          className={
            "mt-[21px] flex h-[155px] flex-row flex-wrap justify-center gap-[10px] overflow-y-auto md:h-full"
          }
        >
          {myPositionsData.map((position) => (
            <Position position={position} key={position.id} />
          ))}
        </div>
      </div>
    </div>
  );
};
