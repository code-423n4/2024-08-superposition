export const MIN_TICK = -887272;

export const MAX_TICK = -MIN_TICK;

export const MIN_SQRT_RATIO = 4295128739n;

export const MAX_SQRT_RATIO =
  1461446703485210103287273052203988822378723970342n;

export const POSSIBLE_TICKS = -MIN_TICK + MAX_TICK;

const MAX_UINT256 = (1n << 256n) - 1n;

export const Q96 = 2n ** 96n;

export const encodeTick = (price: number): number => {
  // log_1.0001(num/denom)
  return Math.floor(Math.log(price) / Math.log(1.0001));
};

export const snapTickToSpacing = (tick: number, spacing: number): number => {
  const t = Math.round(tick / spacing) * spacing;
  if (t > MAX_TICK) return Math.floor(tick / spacing) * spacing;
  if (t < MIN_TICK) return Math.ceil(tick / spacing) * spacing;
  return t;
};

// encodeSqrtPrice, generating slightly off results compared to the
// approach in the code. okay for the frontend though.
export const encodeSqrtPrice = (price: number): bigint => {
  return BigInt(Math.sqrt(price) * 2 ** 96);
};

// convert a sqrtPriceX96 to a price in n digits of precision
// to then be adjusted and converted via token decimals.
export const sqrtPriceX96ToPrice = (
  sqrtPriceX96: bigint,
  decimals: number,
): bigint => {
  const sqrtPrice = sqrtPriceX96 ** 2n;
  const price = (sqrtPrice * 10n ** BigInt(decimals)) / (1n << 192n);
  return price;
};

export const getSqrtRatioAtTick = (tick: bigint): bigint => {
  // the implementation of this function is more or less identical to the
  // one in the Rust tick_math code.
  if (tick > MAX_TICK) throw new Error("exceeding max tick");
  if (tick < MIN_TICK) throw new Error("below min tick");
  let absTick = tick > 0n ? tick : -tick;
  let result =
    (absTick & 1n) != 0n ? 0xfffcb933bd6fad37aa2d162d1a594001n : 1n << 128n;
  absTick >>= 1n;
  let ratio = 340248342086729790484326174814286782778n;
  while (absTick != 0n) {
    if ((absTick & 1n) != 0n) result = (result * ratio) >> 128n;
    ratio = (ratio * ratio) >> 128n;
    absTick >>= 1n;
  }
  if (tick > 0n)
    result =
      0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn /
      result;
  result >>= 32n;
  if (result % (1n << 32n) != 0n) result++;
  return result;
};

const overflowingMulUint256 = (x: bigint, y: bigint) => {
  let v = x * y;
  if (v > MAX_UINT256) return v & MAX_UINT256;
  return v;
};

export const getTickAtSqrtRatio = (sqrtPriceX96: bigint): number => {
  if (sqrtPriceX96 < MIN_SQRT_RATIO || sqrtPriceX96 > MAX_SQRT_RATIO)
    throw new Error("sqrt ratio out of range");

  let ratio = sqrtPriceX96 << 32n;
  let r = ratio;
  let msb = 0n;
  let f = 0n;

  if (r > 0xffffffffffffffffffffffffffffffffn) f = 1n << 7n;
  msb |= f;
  r >>= f;

  if (r > 0xffffffffffffffffn) {
    f = 1n << 6n;
  } else {
    f = 0n;
  }
  msb |= f;
  r >>= f;

  if (r > 0xffffffffn) {
    f = 1n << 5n;
  } else {
    f = 0n;
  }
  msb |= f;
  r >>= f;

  if (r > 0xffffn) {
    f = 1n << 4n;
  } else {
    f = 0n;
  }
  msb |= f;
  r >>= f;

  if (r > 0xffn) {
    f = 1n << 3n;
  } else {
    f = 0n;
  }
  msb |= f;
  r >>= f;

  if (r > 0xfn) {
    f = 1n << 2n;
  } else {
    f = 0n;
  }
  msb |= f;
  r >>= f;

  if (r > 0x3n) {
    f = 1n << 1n;
  } else {
    f = 0n;
  }
  msb |= f;
  r >>= f;

  if (r > 0x1n) {
    f = 1n;
  } else {
    f = 0n;
  }
  msb |= f;

  if (msb >= 128n) {
    r = ratio >> (msb - 127n);
  } else {
    r = ratio << (127n - msb);
  }

  let log2 = (msb - 128n) << 64n;

  for (let i = 63n; i >= 51n; i--) {
    r = overflowingMulUint256(r, r);
    r >>= 127n;
    const x = r >> 128n;
    log2 |= x << i;
    r >>= x;
  }

  r = overflowingMulUint256(r, r);
  r >>= 127n;

  const x = r >> 128n;
  log2 |= x << 50n;

  let logSqrt10001 = log2 * 255738958999603826347141n;

  const tickLow = lowInt32(
    (logSqrt10001 - 3402992956809132418596140100660247210n) >> 128n,
  );
  const tickHigh = lowInt32(
    (logSqrt10001 + 291339464771989622907027621153398088495n) >> 128n,
  );

  let tick = (() => {
    if (tickLow == tickHigh) return tickLow;
    if (getSqrtRatioAtTick(tickHigh) <= sqrtPriceX96) return tickHigh;
    return tickLow;
  })();

  return Number(tick);
};

const lowInt32 = (n: bigint) => {
  const b = new ArrayBuffer(4);
  const d = new DataView(b);
  d.setUint32(0, Number(n & 0xffffffffn), true);
  return BigInt(d.getInt32(0, true));
};

const bigAbs = (n: bigint) => (n < BigInt(0) ? -n : n);

export const getLiquidityForAmount0 = (
  lowerTick: bigint,
  upperTick: bigint,
  amount0: bigint,
): bigint => {
  let sqrtRatioAX96 = getSqrtRatioAtTick(lowerTick);
  let sqrtRatioBX96 = getSqrtRatioAtTick(upperTick);

  if (sqrtRatioAX96 > sqrtRatioBX96) {
    const sqrtRatioAX96_ = sqrtRatioAX96;
    sqrtRatioAX96 = sqrtRatioBX96;
    sqrtRatioBX96 = sqrtRatioAX96_;
  }

  const intermediate = (sqrtRatioAX96 * sqrtRatioBX96) / Q96;
  return (amount0 * intermediate) / (sqrtRatioBX96 - sqrtRatioAX96);
};

export const getLiquidityForAmount1 = (
  lowerTick: bigint,
  upperTick: bigint,
  amount1: bigint,
): bigint => {
  let sqrtRatioAX96 = getSqrtRatioAtTick(lowerTick);
  let sqrtRatioBX96 = getSqrtRatioAtTick(upperTick);

  if (sqrtRatioAX96 > sqrtRatioBX96) {
    const sqrtRatioAX96_ = sqrtRatioAX96;
    sqrtRatioAX96 = sqrtRatioBX96;
    sqrtRatioBX96 = sqrtRatioAX96_;
  }

  return (amount1 * Q96) / (sqrtRatioBX96 - sqrtRatioAX96);
};

export const getLiquidityForAmounts = (
  tick: bigint,
  lowerTick: bigint,
  upperTick: bigint,
  amount0: bigint,
  amount1: bigint,
): bigint => {
  let sqrtRatioAX96 = getSqrtRatioAtTick(lowerTick);
  let sqrtRatioBX96 = getSqrtRatioAtTick(upperTick);

  const sqrtRatioX96 = getSqrtRatioAtTick(tick);

  if (sqrtRatioAX96 > sqrtRatioBX96) {
    const sqrtRatioAX96_ = sqrtRatioAX96;
    sqrtRatioAX96 = sqrtRatioBX96;
    sqrtRatioBX96 = sqrtRatioAX96_;
  }

  if (sqrtRatioX96 <= sqrtRatioAX96) {
    return getLiquidityForAmount0(lowerTick, upperTick, amount0);
  } else if (sqrtRatioX96 < sqrtRatioBX96) {
    const liquidity0 = getLiquidityForAmount0(tick, upperTick, amount0);
    const liquidity1 = getLiquidityForAmount1(lowerTick, tick, amount1);

    if (liquidity0 > liquidity1) {
      return liquidity1;
    } else {
      return liquidity0;
    }
  } else {
    return getLiquidityForAmount1(lowerTick, upperTick, amount1);
  }
};

export const getAmount0ForLiquidity = (
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
): bigint => {
  let sqrtRatio0X96 = sqrtRatioAX96;
  let sqrtRatio1X96 = sqrtRatioBX96;
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    sqrtRatio0X96 = sqrtRatioBX96;
    sqrtRatio1X96 = sqrtRatioAX96;
  }
  const lsl = liquidity << 96n;
  const sqrtDiff = sqrtRatio1X96 - sqrtRatio0X96;
  const res = lsl * sqrtDiff;
  const num = res / sqrtRatio1X96;
  return num / sqrtRatio0X96;
};

export const getAmount1ForLiquidity = (
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
): bigint => {
  let sqrtRatio0X96 = sqrtRatioAX96;
  let sqrtRatio1X96 = sqrtRatioBX96;
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    sqrtRatio0X96 = sqrtRatioBX96;
    sqrtRatio1X96 = sqrtRatioAX96;
  }
  const sqrtDiff = sqrtRatio1X96 - sqrtRatio0X96;
  const res = liquidity * sqrtDiff;
  const amount1 = res / Q96;
  return amount1;
};

export const getAmountsForLiquidity = (
  sqrtRatioX96: bigint,
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
): [bigint, bigint] => {
  let sqrtRatio0X96 = sqrtRatioAX96;
  let sqrtRatio1X96 = sqrtRatioBX96;
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    sqrtRatio0X96 = sqrtRatioBX96;
    sqrtRatio1X96 = sqrtRatioAX96;
  }
  if (sqrtRatioX96 <= sqrtRatio0X96) {
    const amount0 = getAmount0ForLiquidity(
      sqrtRatio0X96,
      sqrtRatio1X96,
      liquidity,
    );
    return [amount0, 0n];
  } else if (sqrtRatioX96 < sqrtRatio1X96) {
    const amount0 = getAmount0ForLiquidity(
      sqrtRatioX96,
      sqrtRatio1X96,
      liquidity,
    );
    const amount1 = getAmount1ForLiquidity(
      sqrtRatio1X96,
      sqrtRatioX96,
      liquidity,
    );
    return [amount0, amount1];
  } else {
    const amount0 = 0n;
    const amount1 = getAmount1ForLiquidity(
      sqrtRatio0X96,
      sqrtRatio1X96,
      liquidity,
    );
    return [amount0, amount1];
  }
};

const getTickAtSqrtPrice = (sqrtPriceX96: number) =>
  Math.floor(Math.log((sqrtPriceX96 / Number(Q96)) ** 2) / Math.log(1.0001));

// lacks precision due to use of number - should be used for display purposes only
export const getTokenAmountsNumeric = (
  liquidity: number,
  sqrtPriceX96: number,
  tickLow: number,
  tickHigh: number,
) => {
  const sqrtRatioA = Math.sqrt(1.0001 ** tickLow);
  const sqrtRatioB = Math.sqrt(1.0001 ** tickHigh);
  const currentTick = getTickAtSqrtPrice(sqrtPriceX96);
  const sqrtPrice = sqrtPriceX96 / Number(Q96);
  let amount0 = 0;
  let amount1 = 0;
  if (currentTick < tickLow) {
    amount0 = Math.floor(
      liquidity * ((sqrtRatioB - sqrtRatioA) / (sqrtRatioA * sqrtRatioB)),
    );
  } else if (currentTick >= tickHigh) {
    amount1 = Math.floor(liquidity * (sqrtRatioB - sqrtRatioA));
  } else if (currentTick >= tickLow && currentTick < tickHigh) {
    amount0 = Math.floor(
      liquidity * ((sqrtRatioB - sqrtPrice) / (sqrtPrice * sqrtRatioB)),
    );
    amount1 = Math.floor(liquidity * (sqrtPrice - sqrtRatioA));
  }

  return [amount0, amount1];
};
