import { formatUnits } from "viem";
import { MAX_TICK, MIN_TICK } from "./math";
import { StakeFormFragmentFragment } from "@/gql/graphql";

const tickMargin = 10000;
export function padLiquidityPool({
  data,
  currentPrice,
  tokenDecimals,
}: {
  data: StakeFormFragmentFragment["liquidity"];
  currentPrice: bigint;
  tokenDecimals: number;
}) {
  let originStartIndex: number = 0;
  let originEndIndex: number = 0;
  let currentPriceIndex: number = 0;
  const paddedData = Array.from(
    { length: Math.ceil((MAX_TICK - MIN_TICK) / tickMargin) },
    (_, i) => {
      const _tickLower = MIN_TICK + i * tickMargin;
      const _tickUpper = MIN_TICK + i * tickMargin + tickMargin;
      const _lowerPrice = 1.0001 ** _tickLower;
      const _upperPrice = 1.0001 ** _tickUpper;
      const _currentPrice = parseFloat(
        formatUnits(currentPrice ?? 0n, tokenDecimals),
      );
      const originDataItem = data.find(
        (e) => e.tickLower === MIN_TICK + i * tickMargin,
      );
      if (!originStartIndex && originDataItem) {
        originStartIndex = i;
        originEndIndex = i + data.length - 1;
      }
      if (
        !currentPriceIndex &&
        _lowerPrice >= _currentPrice &&
        _upperPrice > _currentPrice
      ) {
        currentPriceIndex = i - 1;
      }
      return (
        originDataItem ?? {
          tickLower: _tickLower,
          tickUpper: _tickUpper > MAX_TICK ? MAX_TICK : _tickUpper,
          liquidity: "0",
          price: "0",
        }
      );
    },
  );

  return {
    paddedData,
    originStartIndex,
    originEndIndex,
    currentPriceIndex,
  };
}
