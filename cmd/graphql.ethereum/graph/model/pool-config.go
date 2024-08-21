package model

import (
	"github.com/fluidity-money/long.so/lib/config"
	"github.com/fluidity-money/long.so/lib/types"
)

type SeawaterConfig struct {
	Addr types.Address
	config.Pool
}
