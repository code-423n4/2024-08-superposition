"use client";

import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { format } from "date-fns";
import { DurationSegmentedControl } from "@/components/DurationSegmentedControl";
import { getMockYieldOverTimeData } from "@/demoData/yieldOverTimeData";
import { useMemo, useState } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

const colorGradient = new echarts.graphic.LinearGradient(
  0,
  0,
  0,
  1, // Gradient direction from top(0,0) to bottom(0,1)
  [
    { offset: 0, color: "rgba(243, 184, 216, 0.4)" },
    { offset: 0.25, color: "rgba(183, 147, 233, 0.4)" },
    { offset: 0.5, color: "rgba(159, 212, 243, 0.4)" },
    { offset: 0.75, color: "rgba(255, 210, 196, 0.4)" },
    { offset: 1, color: "rgba(251, 243, 243, 0.4)" },
  ],
);

const durationToDays = {
  "7D": 7,
  "1M": 30,
  "6M": 26, // one bar per week
  "1Y": 52, // one bar per week
  ALL: 52,
};

export const YieldOverTimeGraph = () => {
  const [duration, setDuration] = useState<"7D" | "1M" | "6M" | "1Y" | "ALL">(
    "7D",
  );

  const mockYieldOverTimeData = useMemo(
    () => getMockYieldOverTimeData(durationToDays[duration]),
    [duration],
  );

  const showMockData = useFeatureFlag("ui show demo data");

  return (
    <>
      <div className="flex w-full flex-row items-center justify-between">
        <div className="text-nowrap text-2xs">My Yield Over Time</div>

        <DurationSegmentedControl callback={(val) => setDuration(val)} />
      </div>

      <div className="text-3xl">$12,500.42</div>

      <div className="mt-8 flex flex-col gap-2">
        <ReactECharts
          className="h-[120px]"
          opts={{
            height: 120,
          }}
          style={{
            height: 120,
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
                "<div class='flex flex-col items-center'>${c} <div class='text-gray-2 text-center w-full'>{b}</div></div>",
            },
            xAxis: {
              type: "category",
              data: mockYieldOverTimeData.map((d) => format(d.date, "P")),
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
                name: "Series 2",
                type: "bar",
                stack: "total", // Same 'stack' value as Series 1 to stack them together
                data: mockYieldOverTimeData.map((d) => d.uv),
                itemStyle: {
                  color: "#1E1E1E",
                  borderRadius: [0, 0, 5, 5],
                },
                barWidth: "90%", // Adjust bar width (can be in pixels e.g., '20px')
                barGap: "5%", // Adjust the gap between bars in different series
              },
              {
                name: "series 1",
                stack: "total",
                data: mockYieldOverTimeData.map((d) => d.pv),
                type: "bar",

                itemStyle: {
                  color: colorGradient,
                  borderRadius: [5, 5, 0, 0], // Specify radius for all corners
                  // Border configuration
                  borderColor: "#1E1E1E", // Border color
                  borderWidth: 2, // Border width
                  borderType: "solid", // Border type
                },
              },
            ],
          }}
        />

        <div className="text-xs text-gray-2">Showing May 2024</div>
      </div>
    </>
  );
};
