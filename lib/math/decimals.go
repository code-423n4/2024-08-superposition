package math

import "math/big"

func ExponentiateDecimals(decimals int64) *big.Rat {
	d := new(big.Int).SetInt64(10)
	d.Exp(d, new(big.Int).SetInt64(int64(decimals)), nil)
	return new(big.Rat).SetInt(d)
}
