package model

import (
	"fmt"
	"math/big"

	"github.com/fluidity-money/long.so/lib/types"
)

// Amount often returned from a PairAmount, containing the price of the
// asset (optionally scaled), and the timestamp when it was produced.
type Amount struct {
	Token         types.Address        `json:"token"`
	Decimals      int                  `json:"decimals"`
	Timestamp     int                  `json:"timestamp"`
	ValueUnscaled types.UnscaledNumber `json:"valueUnscaled"`
}

var FloatZero = new(big.Float)

func (obj *Amount) UsdValue(price string, fusdcAddr types.Address) (string, error) {
	value := obj.ValueUnscaled
	dividedAmt := value.Scale(obj.Decimals) //value / (10 ** decimals)
	switch obj.Token {
	case fusdcAddr:
		// 4 decimals
		return fmt.Sprintf("%0.8f", dividedAmt), nil
	default:
		//value / (10 ** decimals) * price
		x := new(big.Float).Set(dividedAmt)
		if price == "" {
			return "0", nil // Empty price.
		}
		priceFloat, ok := new(big.Float).SetString(price)
		if !ok {
			return "", fmt.Errorf("failed to set string: %#v", price)
		}
		if priceFloat.Cmp(FloatZero) == 0 { // Price is also empty (0).
			return "0", nil
		}
		x.Mul(dividedAmt, priceFloat)
		return fmt.Sprintf("%0.8f", x), nil
	}
}
