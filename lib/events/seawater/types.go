package seawater

import (
	"github.com/fluidity-money/long.so/lib/events"
	"github.com/fluidity-money/long.so/lib/types"
)

type (
	MintPosition struct {
		events.Event

		PosId int           `json:"pos_id"`
		Owner types.Address `json:"owner"`
		Pool  types.Address `json:"pool"`
		Lower types.Number  `json:"lower"`
		Upper types.Number  `json:"upper"`
	}

	BurnPosition struct {
		events.Event

		PosId int           `json:"pos_id"`
		Owner types.Address `json:"owner"`
	}

	TransferPosition struct {
		events.Event

		From  types.Address `json:"from_"`
		To    types.Address `json:"to_"`
		PosId int           `json:"pos_id"`
	}

	UpdatePositionLiquidity struct {
		events.Event

		PosId  int           `json:"pos_id"`
		Token0 types.UnscaledNumber `json:"token0"`
		Token1 types.UnscaledNumber `json:"token1"`
	}

	CollectFees struct {
		events.Event

		PosId   int                  `json:"pos_id"`
		Pool    types.Address        `json:"pool"`
		To      types.Address        `json:"to" gorm:"column:to_"`
		Amount0 types.UnscaledNumber `json:"amount0"`
		Amount1 types.UnscaledNumber `json:"amount1"`
	}

	// NewPool created
	NewPool struct {
		events.Event

		Token       types.Address `json:"token"`
		Fee         uint32        `json:"fee"`
		Decimals    uint8         `json:"decimals"`
		TickSpacing uint8         `json:"tickSpacing"`
	}

	CollectProtocolFees struct {
		events.Event

		Pool    types.Address        `json:"pool"`
		To      types.Address        `json:"to_"`
		Amount0 types.UnscaledNumber `json:"amount0"`
		Amount1 types.UnscaledNumber `json:"amount1"`
	}

	Swap1 struct {
		events.Event

		User       types.Address        `json:"user_" gorm:"column:user_"`
		Pool       types.Address        `json:"pool_"`
		ZeroForOne bool                 `json:"zeroForOne"`
		Amount0    types.UnscaledNumber `json:"amount0"`
		Amount1    types.UnscaledNumber `json:"amount1"`
		FinalTick  types.Number         `json:"finalTick"`
	}

	Swap2 struct {
		events.Event

		User        types.Address        `gorm:"column:user_"`
		From        types.Address        `gorm:"column:from_"`
		To          types.Address        `gorm:"column:to_"`
		AmountIn    types.UnscaledNumber `json:"amountIn"`
		AmountOut   types.UnscaledNumber `json:"amountOut"`
		FluidVolume types.UnscaledNumber `json:"fluidVolume"`
		FinalTick0  types.Number         `json:"finalTick0"`
		FinalTick1  types.Number         `json:"finalTick1"`
	}
)
