package model

import (
	"time"

	"github.com/fluidity-money/long.so/lib/types"
)

type SeawaterSwap struct {
	CreatedBy        time.Time            `json:"createdBy"`
	Sender           types.Address        `json:"sender"`
	TokenIn          types.Address        `json:"tokenIn"`
	TokenInDecimals  int                  `json:"tokenInDecimals"`
	TokenOut         types.Address        `json:"tokenOut"`
	TokenOutDecimals int                  `json:"tokenOutDecimals"`
	AmountIn         types.UnscaledNumber `json:"amountIn"`
	AmountOut        types.UnscaledNumber `json:"amountOut"`
	TransactionHash  types.Hash           `json:"transactionHash"`
}
