package main

import (
	_ "embed"

	"github.com/fluidity-money/long.so/lib/config"
	"github.com/fluidity-money/long.so/lib/types"

	"github.com/pelletier/go-toml/v2"
)

//go:embed pools.toml
var poolsConfigBytes []byte

// PoolsConfig loaded from pools.toml in the toplevel
var PoolsConfig map[types.Address]config.Pool

func init() {
	// Needed since the package doesn't do decoding for this properly.
	var c map[string]config.Pool
	if err := toml.Unmarshal(poolsConfigBytes, &c); err != nil {
		panic(err)
	}
	PoolsConfig = make(map[types.Address]config.Pool, len(c))
	for k, v := range c {
		PoolsConfig[types.AddressFromString(k)] = v
	}
}
