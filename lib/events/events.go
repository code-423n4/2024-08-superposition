package events

import (
	"time"

	"github.com/fluidity-money/long.so/lib/types"
)

type Event struct {
	CreatedBy       time.Time     `json:"createdBy"`
	BlockHash       types.Hash    `json:"blockHash"`
	TransactionHash types.Hash    `json:"transactionHash"`
	BlockNumber     uint64        `json:"blockNumber"`
	EmitterAddr     types.Address `json:"emitterAddr"`
}
