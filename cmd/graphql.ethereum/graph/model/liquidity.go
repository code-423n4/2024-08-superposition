package model

// SeawaterLiquidity available in a pool summed and grouped by ticks.
type SeawaterLiquidity struct {
	ID        string `json:"id"`
	TickLower string `json:"tickLower"`
	TickUpper string `json:"tickUpper"`
	Price     string `json:"price"`
	Liquidity string `json:"liquidity"`
}
