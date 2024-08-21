import {
  encodeSqrtPrice,
  getAmountsForLiquidity,
  getLiquidityForAmounts,
  getSqrtRatioAtTick,
  getTickAtSqrtRatio,
} from "@/lib/math";

describe("getLiquidityForAmounts", () => {
  it("amounts for price below", () => {
    const tick = getTickAtSqrtRatio(encodeSqrtPrice(99 / 110));
    const lowerTick = getTickAtSqrtRatio(encodeSqrtPrice(100 / 110));
    const upperTick = getTickAtSqrtRatio(encodeSqrtPrice(110 / 100));
    const liquidity = getLiquidityForAmounts(
      BigInt(tick),
      BigInt(lowerTick),
      BigInt(upperTick),
      100n,
      200n,
    );
    expect(liquidity).toBe(1048n);
  });
  it("amounts for price above", () => {
    const tick = getTickAtSqrtRatio(encodeSqrtPrice(111 / 100));
    const lowerTick = getTickAtSqrtRatio(encodeSqrtPrice(100 / 110));
    const upperTick = getTickAtSqrtRatio(encodeSqrtPrice(110 / 100));
    const liquidity = getLiquidityForAmounts(
      BigInt(tick),
      BigInt(lowerTick),
      BigInt(upperTick),
      100n,
      200n,
    );
    // this differs from the reference tests as encodeSqrtPrice is imprecise
    expect(liquidity).toBe(2096n);
  });
  it("amounts for price equal to lower boundary", () => {
    const lowerTick = getTickAtSqrtRatio(encodeSqrtPrice(100 / 110));
    const tick = lowerTick;
    const upperTick = getTickAtSqrtRatio(encodeSqrtPrice(110 / 100));
    const liquidity = getLiquidityForAmounts(
      BigInt(tick),
      BigInt(lowerTick),
      BigInt(upperTick),
      100n,
      200n,
    );
    expect(liquidity).toBe(1048n);
  });
  it("amounts for price equal to upper boundary", () => {
    const lowerTick = getTickAtSqrtRatio(encodeSqrtPrice(100 / 110));
    const upperTick = getTickAtSqrtRatio(encodeSqrtPrice(110 / 100));
    const tick = upperTick;
    const liquidity = getLiquidityForAmounts(
      BigInt(tick),
      BigInt(lowerTick),
      BigInt(upperTick),
      100n,
      200n,
    );
    // this differs from the reference tests as encodeSqrtPrice is imprecise
    expect(liquidity).toBe(2096n);
  });
});

describe("getAmountsForLiquidity", () => {
  it("amounts for price below", () => {
    const sqrtPriceX96 = encodeSqrtPrice(99 / 110);
    const sqrtPriceAX96 = encodeSqrtPrice(100 / 110);
    const sqrtPriceBX96 = encodeSqrtPrice(110 / 100);
    const [amount0, amount1] = getAmountsForLiquidity(
      sqrtPriceX96,
      sqrtPriceAX96,
      sqrtPriceBX96,
      1048n,
    );
    expect(amount0).toBe(99n);
    expect(amount1).toBe(0n);
  });
  it("amounts for price above", () => {
    const sqrtPriceX96 = encodeSqrtPrice(111 / 100);
    const sqrtPriceAX96 = encodeSqrtPrice(100 / 110);
    const sqrtPriceBX96 = encodeSqrtPrice(110 / 100);
    const [amount0, amount1] = getAmountsForLiquidity(
      sqrtPriceX96,
      sqrtPriceAX96,
      sqrtPriceBX96,
      2097n,
    );
    expect(amount0).toBe(0n);
    expect(amount1).toBe(199n);
  });
  it("amounts for price on lower boundary", () => {
    const sqrtPriceAX96 = encodeSqrtPrice(100 / 110);
    const sqrtPriceX96 = sqrtPriceAX96;
    const sqrtPriceBX96 = encodeSqrtPrice(110 / 100);
    const [amount0, amount1] = getAmountsForLiquidity(
      sqrtPriceX96,
      sqrtPriceAX96,
      sqrtPriceBX96,
      1048n,
    );
    expect(amount0).toBe(99n);
    expect(amount1).toBe(0n);
  });

  it("amounts for price on upper boundary", () => {
    const sqrtPriceAX96 = encodeSqrtPrice(100 / 110);
    const sqrtPriceBX96 = encodeSqrtPrice(110 / 100);
    const sqrtPriceX96 = sqrtPriceBX96;
    const [amount0, amount1] = getAmountsForLiquidity(
      sqrtPriceX96,
      sqrtPriceAX96,
      sqrtPriceBX96,
      2097n,
    );
    expect(amount0).toBe(0n);
    expect(amount1).toBe(199n);
  });
});
