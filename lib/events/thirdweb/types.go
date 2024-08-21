package thirdweb

import (
	"github.com/fluidity-money/long.so/lib/events"
	"github.com/fluidity-money/long.so/lib/types"
)

type AccountCreated struct {
	events.Event

	Account      types.Address `json:"account"`
	AccountAdmin types.Address `json:"accountAdmin"`
}
