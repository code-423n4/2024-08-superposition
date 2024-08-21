package leo

import (
	"time"

	"github.com/fluidity-money/long.so/lib/events"
	"github.com/fluidity-money/long.so/lib/types"
)

type (
	CampaignBalanceUpdated struct {
		events.Event

		Identifier types.Data           `json:"identifier"`
		NewMaximum types.UnscaledNumber `json:"newMaximum"`
	}

	// CampaignCreated, unpacked in the local function with some of
	// the concatenated fields.
	CampaignCreated struct {
		events.Event

		Identifier types.Data    `json:"identifier"`
		Pool       types.Address `json:"pool"`
		Token      types.Address `json:"token"`
		TickLower  int32         `json:"tickLower"`
		TickUpper  int32         `json:"tickUpper"`
		Owner      types.Address `json:"owner"`
		Starting   time.Time     `json:"starting"`
		Ending     time.Time     `json:"ending"`
	}

	CampaignUpdated struct {
		events.Event

		Identifier types.Data    `json:"identifier"`
		Pool       types.Address `json:"pool"`
		PerSecond  types.Number  `json:"perSecond"`
		Token      types.Address `json:"token"`
		TickLower  int32         `json:"tickLower"`
		TickUpper  int32         `json:"tickUpper"`
		Starting   time.Time     `json:"starting"`
		Ending     time.Time     `json:"ending"`
	}
)
