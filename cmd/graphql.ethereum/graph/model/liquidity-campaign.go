package model

import (
	"time"

	"github.com/fluidity-money/long.so/lib/types"
)

// Liquidity campaigns available in this pool that's distributed on-chain.
type LiquidityCampaign struct {
	Pool      types.Address `json:"pool"`
	Token     types.Address `json:"token"`
	TickLower int32         `json:"tick_lower"`
	TickUpper int32         `json:"tick_upper"`
	Owner     types.Address `json:"owner"`
	Starting  time.Time     `json:"starting"`
	Ending    time.Time     `json:"ending"`
}
