import SelectedRange from "@/assets/icons/legend/selected-range.svg";
import CurrentPrice from "@/assets/icons/legend/current-price.svg";
import LiquidityDistribution from "@/assets/icons/legend/liquidity-distribution.svg";
import ReactECharts from "echarts-for-react";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { padLiquidityPool } from "@/lib/padLiquidityPool";
import { useStakeStore } from "@/stores/useStakeStore";
import { fUSDC } from "@/config/tokens";
import { StakeFormFragmentFragment } from "@/gql/graphql";
const colorGradient = new echarts.graphic.LinearGradient(
  0,
  0,
  0,
  1, // Gradient direction from top(0,0) to bottom(0,1)
  [
    { offset: 0, color: "rgba(243, 184, 216, 1)" },
    { offset: 0.25, color: "rgba(183, 147, 233,1)" },
    { offset: 0.5, color: "rgba(159, 212, 243, 1)" },
    { offset: 0.75, color: "rgba(255, 210, 196,1)" },
    { offset: 1, color: "rgba(251, 243, 243, 1)" },
  ],
);
export default function LiquidityRangeVisualizer({
  liquidityRangeType,
  poolDataLiquidity,
  currentPrice,
  tokenDecimals,
}: {
  liquidityRangeType: "full-range" | "auto" | "custom";
  poolDataLiquidity: StakeFormFragmentFragment["liquidity"];
  currentPrice: bigint;
  tokenDecimals: number;
}) {
  const showLiquidityVisualiser = useFeatureFlag(
    "ui show liquidity visualiser",
  );
  const chartRef = useRef<ReactECharts>(null);
  const { token0, priceLower, priceUpper, setPriceLower, setPriceUpper } =
    useStakeStore();

  const paddedLiquidityPool = useMemo(
    () =>
      padLiquidityPool({
        data: poolDataLiquidity,
        currentPrice,
        tokenDecimals,
      }),
    [poolDataLiquidity, currentPrice, tokenDecimals],
  );
  const graphLPData = paddedLiquidityPool.paddedData;
  const graphLPDataSerie = graphLPData?.map((item) =>
    parseFloat(item.liquidity),
  );
  const graphLPDataXAxis = graphLPData?.map(({ tickLower, tickUpper }) => {
    const scale = token0.decimals - fUSDC.decimals;
    const priceLower = (1.0001 ** (tickLower ?? 0) * 10 ** scale).toFixed(
      fUSDC.decimals,
    );
    const priceHigher = (1.0001 ** (tickUpper ?? 0) * 10 ** scale).toFixed(
      fUSDC.decimals,
    );

    return `${priceLower}-${priceHigher}`;
  });

  const chartStyles = {
    color: {
      "full-range": colorGradient,
      auto: "transparent",
      custom: "white",
    },
    borderSet: {
      "full-range": {
        borderColor: colorGradient,
        borderWidth: 1,
        borderType: "solid",
      },
      auto: {
        borderColor: "#EBEBEB",
        borderWidth: 1,
        borderType: "dashed",
      },
      custom: {
        borderColor: "#EBEBEB",
        borderWidth: 1,
        borderType: "dashed",
      },
    },
  };
  const chartOptions = useMemo(
    () => ({
      grid: {
        left: "0", // or a small value like '10px'
        right: "0", // or a small value
        top: "0", // or a small value
        bottom: "0", // or a small value
      },
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: 0,
        },
      ],
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
        },
        borderWidth: 0,
        backgroundColor: "#EBEBEB",
        textStyle: {
          color: "#1E1E1E",
        },
        formatter:
          "<div class='flex flex-col items-center'>${c} <div class='text-gray-2 text-center w-full'>{b}</div></div>",
      },
      toolbox: {
        show: false,
      },
      brush: {
        show: liquidityRangeType === "custom",
        xAxisIndex: "all",
        brushLink: "all",
        outOfBrush: {
          color: "#1E1E1E",
        },
      },
      xAxis: {
        type: "category",
        data: graphLPDataXAxis,
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
          data: graphLPDataSerie,
          type: "bar",
          barWidth: "90%",
          barGap: "5%",
          silent: true,
          itemStyle: {
            color: chartStyles.color[liquidityRangeType],
            borderRadius: [5, 5, 0, 0],
            ...chartStyles.borderSet[liquidityRangeType],
          },
          selectedMode: liquidityRangeType === "auto" ? "multiple" : false,
          select: {
            itemStyle: {
              color: "#C0E9B6",
              borderColor: "#C0E9B6",
              borderWidth: 1,
            },
          },
          emphasis: {
            itemStyle: {
              color: "white",
              borderWidth: 0,
            },
          },
        },
      ],
    }),
    [
      liquidityRangeType,
      graphLPDataSerie,
      graphLPDataXAxis,
      chartStyles.borderSet,
      chartStyles.color,
    ],
  );

  const lowIndex = graphLPData?.findIndex(
    (item) =>
      parseFloat(priceLower) <= 1.0001 ** item.tickUpper &&
      parseFloat(priceLower) >= 1.0001 ** item.tickLower,
  );
  const highIndex = graphLPData?.findLastIndex(
    (item) =>
      parseFloat(priceUpper) <= 1.0001 ** item.tickUpper &&
      parseFloat(priceUpper) >= 1.0001 ** item.tickLower,
  );

  const handleBrushEnd = useCallback(
    function ({ areas }: any) {
      if (!graphLPData) return;

      const lowerIndex = areas[0].coordRange[0];
      const upperIndex = areas[0].coordRange[1];

      setPriceLower(
        (1.0001 ** graphLPData[lowerIndex].tickLower).toFixed(fUSDC.decimals),
        token0.decimals,
      );
      setPriceUpper(
        (1.0001 ** graphLPData[upperIndex].tickUpper).toFixed(fUSDC.decimals),
        token0.decimals,
      );
    },
    [setPriceLower, setPriceUpper, token0.decimals, graphLPData],
  );

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (chart) {
      chart.setOption(chartOptions);
      chart.on("brushEnd", handleBrushEnd);

      //  Clear the brush selection on every liquidityRangeType change
      chart.dispatchAction({
        type: "brush",
        command: "clear",
        areas: [],
      });
      chart.dispatchAction({
        type: "select",
        seriesIndex: 0,
        dataIndex: [paddedLiquidityPool.currentPriceIndex],
      });
      if (liquidityRangeType === "auto") {
        chart.dispatchAction({
          type: "dataZoom",
          startValue: Math.min(
            paddedLiquidityPool.originStartIndex,
            paddedLiquidityPool.currentPriceIndex,
          ),
          endValue: Math.max(
            paddedLiquidityPool.originEndIndex,
            paddedLiquidityPool.currentPriceIndex,
          ),
        });
      } else {
        // zoom out to full range
        chart.dispatchAction({
          type: "dataZoom",
          start: 0,
          end: 100,
        });

        if (liquidityRangeType === "custom") {
          chart.dispatchAction({
            type: "brush",
            areas: [
              {
                brushType: "lineX",
                coordRange: [lowIndex, highIndex],
                xAxisIndex: 0,
              },
            ],
          });
        }
      }

      return () => {
        chart.off("brushEnd", handleBrushEnd);
      };
    }
  }, [
    chartOptions,
    lowIndex,
    highIndex,
    paddedLiquidityPool,
    liquidityRangeType,
    handleBrushEnd,
  ]);

  return (
    showLiquidityVisualiser && (
      <div className="mt-[22px]">
        <div className="text-3xs text-gray-2 md:text-2xs">Visualiser</div>
        <ReactECharts
          className="mt-1"
          opts={{
            height: 44,
          }}
          style={{
            height: 44,
          }}
          ref={chartRef}
          option={chartOptions}
        />

        <div className="mt-[16px] flex flex-row justify-around text-4xs md:text-2xs">
          <div className="flex flex-row items-center gap-1">
            <SelectedRange /> Selected Range
          </div>
          <div className="flex flex-row items-center gap-1">
            <CurrentPrice /> Current Price
          </div>
          <div className="flex flex-row items-center gap-1">
            <LiquidityDistribution /> Liquidity Distribution
          </div>
        </div>
      </div>
    )
  );
}
