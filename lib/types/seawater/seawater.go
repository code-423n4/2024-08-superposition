package seawater

import (
	"time"

	"github.com/fluidity-money/long.so/lib/types"
)

// Pool is set by events_seawater_newPool
type Pool struct {
	CreatedBy       time.Time     `json:"createdBy"`
	BlockHash       types.Hash    `json:"blockHash"`
	TransactionHash types.Hash    `json:"transactionHash"`
	BlockNumber     types.Number  `json:"blockNumber"`
	Token           types.Address `json:"token"`
	Fee             types.Number  `json:"fee"`
	Decimals        int           `json:"decimals"`
	TickSpacing     uint8         `json:"tickSpacing"`
}

// Position is set by seawater_active_positions_1
type Position struct {
	CreatedBy       time.Time     `json:"createdBy"`
	BlockHash       types.Hash    `json:"blockHash"`
	TransactionHash types.Hash    `json:"transactionHash"`
	BlockNumber     types.Number  `json:"blockNumber"`
	Id              int           `json:"id" gorm:"column:pos_id"` // ID name might cause issues with gorm
	Owner           types.Address `json:"owner"`
	Pool            types.Address `json:"pool"`
	Lower           types.Number  `json:"lower"`
	Upper           types.Number  `json:"upper"`
}

// PositionSnapshot taken from snapshot_positions_log_1. Used to service
// liquidity queries.
type PositionSnapshot struct {
	PosId     int                  `json:"pos_id"`
	UpdatedBy time.Time            `json:"updated_by"`
	Owner     types.Address        `json:"owner"`
	Pool      types.Address        `json:"pool"`
	Lower     types.Number         `json:"lower"`
	Upper     types.Number         `json:"upper"`
	Amount0   types.UnscaledNumber `json:"amount0"`
	Amount1   types.UnscaledNumber `json:"amount1"`
}

// LiquidityGroup taken from seawater_liquidity_groups_1. Used to service
// the graph display of liquidity ranges.
type LiquidityGroup struct {
	Pool              types.Address        `json:"pool"`
	Decimals          uint8                `json:"decimals"`
	Tick              types.Number         `json:"tick"`
	NextTick          types.Number         `json:"next_tick"`
	CumulativeAmount0 types.UnscaledNumber `json:"cumulative_amount_0"`
	CumulativeAmount1 types.UnscaledNumber `json:"cumulative_amount_1"`
}

// SnapshotPositionsLatestDecimalsGroup taken from
// snapshot_positions_latest_decimals_grouped_1, or from
// snapshot_positions_latest_decimals_grouped_user_1_return. Used to
// service requests for the summated amounts in the positions request.
type SnapshotPositionsLatestDecimalsGroup struct {
	Pool              types.Address        `json:"pool"`
	Decimals          uint8                `json:"decimals"`
	CumulativeAmount0 types.UnscaledNumber `json:"cumulative_amount_0"`
	CumulativeAmount1 types.UnscaledNumber `json:"cumulative_amount_1"`
}

// SwapsDecimalsGroup taken from the swaps_decimals_pool_group_1 and
// swaps_decimals_user_group_1. Used to service requests for summations
// of the volume of swaps made.
type SwapsDecimalsGroup struct {
	Pool              types.Address        `json:"pool"`
	Decimals          uint8                `json:"decimals"`
	CumulativeAmount0 types.UnscaledNumber `json:"cumulative_amount_0"`
	CumulativeAmount1 types.UnscaledNumber `json:"cumulative_amount_1"`
}
