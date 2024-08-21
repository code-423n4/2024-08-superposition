import { Badge } from "@/components/ui/badge";
import { DurationSegmentedControl } from "@/components/DurationSegmentedControl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactECharts from "echarts-for-react";
import { traderRewardsData } from "@/components/InventoryContent/data/traderRewardsData";
import { format, startOfDay } from "date-fns";
import { TransactionHistoryTable } from "@/app/_TransactionHistoryTable/TransactionHistoryTable";
import {
  columns,
  TransactionHistory,
} from "@/app/_TransactionHistoryTable/columns";
import { transactionHistoryData as mockTransactionHistoryData } from "@/components/InventoryContent/data/transactionHistoryData";
import { graphql, useFragment } from "@/gql";
import { useGraphqlUser } from "@/hooks/useGraphql";
import { useMemo, useState } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import Ethereum from "@/assets/icons/ethereum.svg";
import Token from "@/assets/icons/token.svg";
import { groupBy, map, orderBy, sortBy, sumBy } from "lodash";
import { usdFormat } from "@/lib/usdFormat";

const durationToDays = {
  "7D": 7,
  "1M": 30,
  "6M": 182,
  "1Y": 365,
  ALL: 365,
};

const TradeTabTransactionsFragment = graphql(`
  fragment TradeTabTransactionsFragment on SeawaterSwap {
    timestamp
    amountIn {
      token {
        symbol
      }
      valueScaled
    }
    amountOut {
      token {
        symbol
      }
      valueScaled
    }
  }
`);

export const TradeTabContent = () => {
  const { data } = useGraphqlUser();

  /**
   * All transactions for a user
   */
  const transactions = useFragment(
    TradeTabTransactionsFragment,
    data?.getSwapsForUser?.data.swaps,
  );

  const showMockData = useFeatureFlag("ui show demo data");

  /**
   * The transaction history data to display.
   */
  const transactionHistoryData = useMemo(():
    | TransactionHistory[]
    | undefined => {
    // show mock data if the feature flag is enabled
    if (showMockData) return mockTransactionHistoryData;

    return orderBy(
      // reformat the data to match the TransactionHistory interface
      transactions?.map(
        (transaction) =>
          ({
            id: transaction.timestamp.toString(),
            date: new Date(transaction.timestamp * 1000),
            // TODO: get reward value
            rewards: 0,
            amountIn: parseFloat(transaction.amountIn.valueScaled),
            amountOut: parseFloat(transaction.amountOut.valueScaled),
            tokens: [
              {
                // one of these values will be an empty string
                name: transaction.amountIn.token.symbol || "fUSDC",
                icon: transaction.amountIn.token.symbol ? (
                  <Ethereum className={"invert"} />
                ) : (
                  <Token />
                ),
              },
              {
                name: transaction.amountOut.token.symbol || "fUSDC",
                icon: transaction.amountOut.token.symbol ? (
                  <Ethereum className={"invert"} />
                ) : (
                  <Token />
                ),
              },
            ],
          }) satisfies TransactionHistory & {
            amountIn: number;
            amountOut: number;
          },
      ),
      "date",
      "desc",
    );
  }, [showMockData, transactions]);

  /**
   * The sum of all rewards from all transactions.
   */
  const totalTradeRewards = useMemo(
    () => sumBy(transactionHistoryData, "rewards"),
    [transactionHistoryData],
  );

  const [duration, setDuration] = useState<"7D" | "1M" | "6M" | "1Y" | "ALL">(
    "7D",
  );

  /**
   * The data to display in the graph.
   */
  const graphData = useMemo(() => {
    // if the feature flag is enabled show mock data
    if (showMockData) return traderRewardsData;

    // otherwise, we need to calculate the data

    // group transactions into days
    const groupedTransactions = groupBy(transactionHistoryData, (transaction) =>
      startOfDay(transaction.date),
    );

    // sum each day's rewards
    const summedRewards = map(groupedTransactions, (transactions, date) => ({
      date: new Date(date),
      value: sumBy(transactions, "amountIn"), // TODO: replace with rewards
    }));

    // sort by date
    const sortedRewards = sortBy(summedRewards, "date");

    // we need to add in missing dates
    // get the first and last dates
    const allDatesWithData = sortedRewards.map((d) => d.date);
    // first date
    const firstDate = allDatesWithData[0];
    // last date
    const lastDate = allDatesWithData[allDatesWithData.length - 1];

    // get all dates between the first and last date
    const allDates = [];
    let currentDate = firstDate;
    while (currentDate <= lastDate) {
      allDates.push(currentDate);
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    // add in missing dates
    const allRewards = allDates.map((date) => {
      // find the reward for this date
      const reward = sortedRewards.find(
        (r) => r.date.getTime() === date.getTime(),
      );

      // if no reward for this date, return 0
      return {
        date,
        value: reward?.value || 0,
      };
    });

    // return the data for the duration
    let slicedData = allRewards.reverse().slice(0, durationToDays[duration]);

    return slicedData;
  }, [showMockData, transactionHistoryData, duration]);

  return (
    <div className="mt-[34px] flex flex-col items-center ">
      <div className={"text-[14px] font-medium "}>My Total Trade Rewards</div>

      <Badge
        variant={"iridescent"}
        className={"mt-[12px] text-[30px] font-medium"}
      >
        {usdFormat(totalTradeRewards)}
      </Badge>

      <div className="mt-[19px] w-[223px] text-center text-[10px] font-normal text-neutral-400 md:mt-[28px]">
        Earn more by making more transactions!
      </div>

      <div className="mt-[42px] flex w-full flex-row items-center justify-between">
        <div className="text-[10px] font-medium">Trader Rewards Over Time</div>
        {/* only on desktop */}
        <DurationSegmentedControl
          variant={"secondary"}
          className={"hidden text-[10px] md:flex"}
          callback={(val) => setDuration(val)}
        />
        {/* only on mobile */}
        <Select>
          <SelectTrigger className="w-[90px] border-0 bg-transparent text-right text-[10px] md:hidden">
            <SelectValue defaultValue={"7D"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7D" onSelect={() => setDuration("7D")}>
              7 Days
            </SelectItem>
            <SelectItem value="1M" onSelect={() => setDuration("1M")}>
              1 Month
            </SelectItem>
            <SelectItem value="6M" onSelect={() => setDuration("6M")}>
              6 Months
            </SelectItem>
            <SelectItem value="1Y" onSelect={() => setDuration("1Y")}>
              1 Year
            </SelectItem>
            <SelectItem value="ALL" onSelect={() => setDuration("ALL")}>
              All Time
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ReactECharts
        className="mt-[10px] h-[70px] w-full  md:mt-[20px]"
        opts={{
          height: 70,
        }}
        style={{
          height: 70,
        }}
        option={{
          grid: {
            left: "0", // or a small value like '10px'
            right: "0", // or a small value
            top: "0", // or a small value
            bottom: "0", // or a small value
          },
          tooltip: {
            trigger: "axis", // Trigger tooltip on axis movement
            axisPointer: {
              type: "cross", // Display crosshair style pointers
            },
            borderWidth: 0,
            backgroundColor: "#EBEBEB",
            textStyle: {
              color: "#1E1E1E",
            },
            formatter:
              "<div class='flex flex-col items-center'>${c} <div class='text-gray-2 text-center w-full'>{b}</div></div>",
          },
          xAxis: {
            type: "category",
            data: graphData?.map((d) => format(d.date, "P")),
            show: false,
            axisPointer: {
              label: {
                show: false,
              },
            },
          },
          yAxis: {
            type: "value",
            show: false,
            axisPointer: {
              label: {
                show: false,
              },
            },
          },
          series: [
            {
              type: "bar",
              data: graphData?.map((d) => d.value),
              itemStyle: {
                color: "#EBEBEB",
              },
              barWidth: "70%", // Adjust bar width (can be in pixels e.g., '20px')
              barGap: "30%", // Adjust the gap between bars in different series
            },
          ],
        }}
      />

      <div className={"mt-[13px] w-full text-left text-[10px]"}>
        22nd February 2024
      </div>

      <div className="mt-[30px] w-full text-left text-[10px]">
        My Transaction History
      </div>

      {transactionHistoryData && (
        <TransactionHistoryTable
          columns={columns}
          data={transactionHistoryData}
        />
      )}
    </div>
  );
};
