package math

import "math/big"

var (
	One  = new(big.Int).SetInt64(1)
	Zero = new(big.Int).SetInt64(0)

	// Two192 for some calculations (2 ** 192)
	//6277101735386680763835789423207666416102355444464034512896
	Two192 = new(big.Rat).SetInt(new(big.Int).SetBits([]big.Word{0, 0, 0, 1}))
)

var (
	// MinTick that could be used in the tick range.
	MinTick = new(big.Int).SetInt64(-887272)

	// MaxTick that could be used.
	MaxTick = new(big.Int).SetInt64(887272)

	// MinSqrtRatio (price) that could be set.
	MinSqrtRatio = new(big.Int).SetInt64(4295128739)

	// MaxSqrtRatio that could be used as price data.
	//1461446703485210103287273052203988822378723970342n
	MaxSqrtRatio = new(big.Int).SetBits([]big.Word{0x5d951d5263988d26, 0xefd1fc6a50648849, 0xfffd8963})
)

// Q96 to use for some math operations
// 79228162514264337593543950336
var Q96 = new(big.Int).SetBits([]big.Word{0, 0x100000000})

// GetAmountsForLiq with sqrtRatioX96 being the first tick boundary, and
// sqrtRatioAX96 being the second. liq being the amount of liquidity in
// the position.
func GetAmountsForLiq(sqrtRatioX96, sqrtRatioAX96, sqrtRatioBX96, liq *big.Int) (amount0 *big.Rat, amount1 *big.Rat) {
	switch { // If anything is nil, then we return 0.
	case sqrtRatioX96 == nil, sqrtRatioAX96 == nil, sqrtRatioBX96 == nil, liq == nil:
		return new(big.Rat), new(big.Rat) // 0, 0
	}
	var (
		sqrtRatio0X96 = sqrtRatioAX96
		sqrtRatio1X96 = sqrtRatioBX96
	)
	//if sqrtRatioAX96 > sqrtRatioBX96
	if sqrtRatioAX96.Cmp(sqrtRatioBX96) > 0 {
		sqrtRatio0X96 = sqrtRatioBX96
		sqrtRatio1X96 = sqrtRatioAX96
	}
	switch {
	//if sqrtRatioX96 <= sqrtRatio0X96
	case sqrtRatioX96.Cmp(sqrtRatio0X96) <= 0:
		amount0 = GetAmount0ForLiq(sqrtRatio0X96, sqrtRatio1X96, liq)
		amount1 = new(big.Rat)

	//if sqrtRatioX96 < sqrtRatio1X96
	case sqrtRatioX96.Cmp(sqrtRatio1X96) < 0:
		amount0 = GetAmount0ForLiq(sqrtRatioX96, sqrtRatio1X96, liq)
		amount1 = GetAmount1ForLiq(sqrtRatio0X96, sqrtRatioX96, liq)

	default:
		amount0 = new(big.Rat)
		amount1 = GetAmount1ForLiq(sqrtRatio0X96, sqrtRatio1X96, liq)
	}
	return
}

func GetAmount0ForLiq(sqrtRatioAX96, sqrtRatioBX96, liq *big.Int) (amount0 *big.Rat) {
	switch { // If anything is nil, then we return 0.
	case sqrtRatioAX96 == nil, sqrtRatioBX96 == nil, liq == nil:
		return new(big.Rat) // 0
	}
	var (
		sqrtRatio0X96 = sqrtRatioAX96
		sqrtRatio1X96 = sqrtRatioBX96
	)
	//if sqrtRatioAX96 > sqrtRatioBX96
	if sqrtRatioAX96.Cmp(sqrtRatioBX96) > 0 {
		sqrtRatio0X96 = sqrtRatioBX96
		sqrtRatio1X96 = sqrtRatioAX96
	}
	lsl := new(big.Int).Lsh(liq, 96)
	sqrtDiff := new(big.Int).Sub(sqrtRatio1X96, sqrtRatio0X96)
	res := new(big.Int).Mul(lsl, sqrtDiff)
	num := new(big.Int).Quo(res, sqrtRatio1X96)
	//num / sqrtRatio0X96
	amount0 = new(big.Rat).Quo(
		new(big.Rat).SetInt(num),
		new(big.Rat).SetInt(sqrtRatio0X96),
	)
	return
}

func GetAmount1ForLiq(sqrtRatioAX96, sqrtRatioBX96, liq *big.Int) (amount1 *big.Rat) {
	switch { // If anything is nil, then we return 0.
	case sqrtRatioAX96 == nil, sqrtRatioBX96 == nil, liq == nil:
		return new(big.Rat) // 0
	}
	var (
		sqrtRatio0X96 = sqrtRatioAX96
		sqrtRatio1X96 = sqrtRatioBX96
	)
	//if sqrtRatioAX96 > sqrtRatioBX96
	if sqrtRatioAX96.Cmp(sqrtRatioBX96) > 0 {
		sqrtRatio0X96 = sqrtRatioBX96
		sqrtRatio1X96 = sqrtRatioAX96
	}
	//sqrtRatio1X96 - sqrtRatio0X96
	sqrtDiff := new(big.Rat).Sub(
		new(big.Rat).SetInt(sqrtRatio1X96),
		new(big.Rat).SetInt(sqrtRatio0X96),
	)
	res := new(big.Rat).Mul(new(big.Rat).SetInt(liq), sqrtDiff)
	amount1 = new(big.Rat).Quo(res, new(big.Rat).SetInt(Q96))
	return
}

func GetSqrtRatioAtTick(t *big.Int) *big.Int {
	absTick := new(big.Int).Abs(t)
	//340248342086729790484326174814286782778
	ratio := new(big.Int).SetBits([]big.Word{0x59a46990580e213a, 0xfff97272373d4132})
	res := new(big.Int).And(absTick, One)
	//if res != 0
	if res.Cmp(Zero) != 0 {
		//340265354078544963557816517032075149313
		res.SetBits([]big.Word{0xaa2d162d1a594001, 0xfffcb933bd6fad37})
	} else {
		res.Lsh(One, 128)
	}
	absTick.Rsh(absTick, 1)
	//while absTick != 0
	for absTick.Cmp(Zero) != 0 {
		//if absTick & 1n != 0
		if new(big.Int).And(absTick, One).Cmp(Zero) != 0 {
			res.Mul(res, ratio)
			res.Rsh(res, 128)
		}
		ratio.Mul(ratio, ratio)
		ratio.Rsh(ratio, 128)
		absTick.Rsh(absTick, 1)
	}
	//if t > 0
	if t.Cmp(Zero) > 0 {
		x := new(big.Int).Lsh(One, 256)
		x.Sub(x, One)
		// res / max(uint256).max
		res.Quo(x, res)
	}
	res.Rsh(res, 32)
	//if result % (1n << 32n) != 0
	if new(big.Int).Mod(res, new(big.Int).Set(One).Lsh(One, 32)).Cmp(Zero) != 0 {
		res.Add(res, One)
	}
	return res
}

func GetPriceAtSqrtRatio(x *big.Int) *big.Rat {
	r := new(big.Rat).SetInt(x)
	r.Mul(r, r)
	r.Quo(r, Two192)
	return r
}
