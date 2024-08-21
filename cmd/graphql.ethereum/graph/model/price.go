package model

import (
	"github.com/fluidity-money/long.so/lib/math"
	"github.com/fluidity-money/long.so/lib/types"
)

type PriceResult struct {
	FinalTick types.Number `json:"final_tick"`
}

// Price to obtain the price from the final tick as a formatted float string
func (p PriceResult) Price(fusdcDecimals, poolDecimals int) string {
	sqrtPrice := math.GetSqrtRatioAtTick(p.FinalTick.Big())
	price := math.GetPriceAtSqrtRatio(sqrtPrice)
	decimals := math.ExponentiateDecimals(int64(poolDecimals - fusdcDecimals))
	price.Mul(price, decimals)
	return price.FloatString(5)
}
