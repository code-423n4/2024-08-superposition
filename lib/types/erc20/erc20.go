package erc20

import "github.com/fluidity-money/long.so/lib/types"

type Erc20 struct {
	Address     types.Address        `json:"address"`
	Name        string               `json:"name"`
	Symbol      string               `json:"symbol"`
	TotalSupply types.UnscaledNumber `json:"total_supply"`
	Decimals    int                  `json:"decimals"`
}
