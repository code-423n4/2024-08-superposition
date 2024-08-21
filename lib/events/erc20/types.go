package erc20

import (
	"github.com/fluidity-money/long.so/lib/types"
	"github.com/fluidity-money/long.so/lib/events"
)

type Transfer struct {
	events.Event

	Sender    types.Address        `json:"sender"`
	Recipient types.Address        `json:"recipient"`
	Value         types.UnscaledNumber `json:"value"`
}
