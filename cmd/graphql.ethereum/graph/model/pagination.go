package model

import (
	"github.com/fluidity-money/long.so/lib/types"
	"github.com/fluidity-money/long.so/lib/types/seawater"
)

// Pagination-friendly way of viewing the current state of the positions available in a pool.
type SeawaterPositions struct {
	// From is used alongside To to find the cursor position in the
	// database scan. Pool is also used to filter for this.
	// We use the position id for everything.
	From int  `json:"from"`
	To   *int `json:"to"`

	// Pool is set, then we assume the filtering needs to happen for a pool.
	Pool *types.Address `json:"pool"`
	// Wallet is set, then we assume it needs to happen for a specific wallet.
	Wallet *types.Address

	Positions []seawater.Position `json:"positions"`
}

type (
	SeawaterPositionsGlobal SeawaterPositions
	SeawaterPositionsUser   SeawaterPositions
)

// Pagination-friendly way to quickly receive swaps made somewhere. Knows internally where it
// came from, where it's at with pagination, and lets you continue to paginate through it
// optionally.
type SeawaterSwaps struct {
	From int `json:"from"`
	To   int `json:"to"`

	// Pool, if set, enables filtering based on the pool that's used here.
	Pool *types.Address `json:"pool"`
	// Wallet is set, then we assume it needs to happen for a specific wallet.
	Wallet *types.Address

	Swaps []SeawaterSwap `json:"swaps"`
}
