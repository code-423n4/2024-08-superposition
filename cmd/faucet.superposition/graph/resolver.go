package graph

import (
	"gorm.io/gorm"

	ethCommon "github.com/ethereum/go-ethereum/common"

	"github.com/fluidity-money/long.so/lib/config"
	"github.com/fluidity-money/long.so/lib/features"
)

type (
	Resolver struct {
		DB              *gorm.DB   // db used to look up any fields that are missing from a request.
		F               features.F // features to have enabled when requested
		C               config.C   // config for connecting to the right endpoints
		TurnstileSecret string     // Turnstile secret to use for verification
	}

	// FaucetReq to an IP address given, assuming they passed the
	// restrictions.
	FaucetReq struct {
		Addr     ethCommon.Address
		IsStaker bool
		Resp     chan error
	}
)
