"use client";

import { useMemo, useRef, useState } from "react";
import { getSwapProGraphMockData } from "@/components/SwapPro/SwapProGraphData";
import SegmentedControl from "@/components/ui/segmented-control";
import { startCase } from "lodash";
import { DurationSegmentedControl } from "@/components/DurationSegmentedControl";
import { TypographyH2 } from "@/components/ui/typography";
import ReactECharts from "echarts-for-react";
import { format, subDays } from "date-fns";
import { SwapProPoolFragmentFragment } from "@/gql/graphql";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { usdFormat } from "@/lib/usdFormat";

const durationToDays = {
  "7D": 7,
  "1M": 30,
  "6M": 6,
  "1Y": 12,
  ALL: 52,
};

export const Graph = ({
  pool,
  currentPrice,
}: {
  pool?: SwapProPoolFragmentFragment;
  currentPrice: string;
}) => {
  const [activeGraphType, setActiveGraphType] = useState<
    "price" | "volume" | "liquidity"
  >("volume");

  const [duration, setDuration] = useState<"7D" | "1M" | "6M" | "1Y" | "ALL">(
    "7D",
  );

  const swapProGraphMockData = useMemo(
    () => getSwapProGraphMockData(durationToDays[duration]),
    [duration],
  );

  const showMockData = useFeatureFlag("ui show demo data");

  const [graphData, graphHeader] = useMemo(() => {
    // if the feature flag is enabled show mock data
    if (showMockData) return [swapProGraphMockData, "$12.05"];

    // if the duration is 7D or 1M
    let durationKey: "daily" | "monthly" = "daily";

    // if the duration is 6M, 1Y or ALL
    if (duration === "6M" || duration === "1Y" || duration === "ALL") {
      durationKey = "monthly";
    }

    // work out what data to show
    if (activeGraphType === "volume") {
      // return the data for the duration
      let slicedData = pool?.volumeOverTime[durationKey];

      // slice out the data we want
      if (duration !== "ALL") {
        slicedData = slicedData?.slice(0, durationToDays[duration]);
      }

      slicedData = slicedData?.reverse();
      const last = slicedData?.at(-1);
      const header = usdFormat(
        parseFloat(last?.fusdc.valueUsd ?? "0") +
          parseFloat(last?.token1.valueUsd ?? "0"),
      );

      return [
        slicedData
          // reformat pool data to match expected graph data
          ?.map((d) => ({
            date: new Date(d.fusdc.timestamp * 1000),
            value: parseFloat(d.fusdc.valueUsd),
          })),
        header,
      ];
    }

    if (activeGraphType === "price") {
      // return the data for the duration
      let slicedData = pool?.priceOverTime[durationKey];

      if (duration !== "ALL") {
        slicedData = slicedData?.slice(0, durationToDays[duration]);
      }

      const now = new Date();

      return [
        slicedData
          // reformat pool data to match expected graph data
          ?.map((d, i) => ({
            // step each entry back by one day or month, depending on the duration key
            date:
              durationKey === "daily"
                ? new Date().setDate(now.getDate() - i)
                : new Date().setMonth(now.getMonth() - i),
            value: parseFloat(d),
          }))
          .reverse(),
        currentPrice,
      ];
    }

    if (activeGraphType === "liquidity") {
      // return the data for the duration
      let slicedData = pool?.liquidityOverTime[durationKey];

      if (duration !== "ALL") {
        slicedData = slicedData?.slice(0, durationToDays[duration]);
      }
      slicedData = slicedData?.reverse();

      const last = slicedData?.at(-1);
      // TODO - should liquidity include token1 value as well?
      const header = usdFormat(parseFloat(last?.fusdc.valueUsd ?? "0"));

      return [
        slicedData
          // reformat pool data to match expected graph data
          ?.map((d) => ({
            date: new Date(d.timestamp * 1000),
            value: parseFloat(d.fusdc.valueUsd),
          })),
        header,
      ];
    }

    // should never reach here
    return [];
  }, [
    showMockData,
    swapProGraphMockData,
    pool,
    activeGraphType,
    duration,
    currentPrice,
  ]);

  return (
    <>
      <div className={"flex flex-row justify-start"}>
        <SegmentedControl
          callback={(val) => setActiveGraphType(val)}
          segments={[
            {
              label: "Price",
              value: "price",
              ref: useRef(),
            },
            {
              label: "Volume",
              value: "volume",
              ref: useRef(),
            },
            {
              label: "Liquidity",
              value: "liquidity",
              ref: useRef(),
            },
          ]}
        />
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-row justify-between">
          <div>
            <div className="text-sm md:hidden">
              {/* this text is only shown on mobile */}
              fUSDC/{pool?.token?.symbol} {startCase(activeGraphType)}
            </div>
          </div>

          <DurationSegmentedControl callback={(val) => setDuration(val)} />
        </div>
        <TypographyH2 className="border-b-0">{graphHeader}</TypographyH2>
        <div className="flex flex-col gap-2">
          <ReactECharts
            opts={{
              height: 150,
            }}
            style={{
              height: 150,
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
                backgroundColor: "#1E1E1E",
                textStyle: {
                  color: "#EBEBEB",
                },
                formatter:
                  // TODO: value is very large, how to format?
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
                    color: "#1E1E1E",
                  },
                  barWidth: "60%", // Adjust bar width (can be in pixels e.g., '20px')
                  barGap: "5%", // Adjust the gap between bars in different series
                },
              ],
            }}
          />

          <div className="text-2xs">{new Date().toString()}</div>
        </div>
      </div>
    </>
  );
};
