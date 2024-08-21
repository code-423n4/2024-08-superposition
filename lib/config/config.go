// config contains configuration behaviour that should be configured
// using environment variables that're global.
//

package config

import (
	"math/rand"
	"os"
	"strings"

	"github.com/fluidity-money/long.so/lib/setup"
	"github.com/fluidity-money/long.so/lib/types"
)

// C is configuration for each service, and globally.
type C struct {
	GethUrl                 string
	TimescaleUrls           []string
	SeawaterAddr, FusdcAddr types.Address
	FusdcDecimals           int
	FusdcTotalSupply        types.UnscaledNumber
	FusdcSymbol, FusdcName  string
}

// Get config by querying environment variables.
func Get() C {
	/* Global RPC configuration. */
	gethUrl := os.Getenv("SPN_GETH_URL")
	if gethUrl == "" {
		setup.Exitf("SPN_GETH_URL not set")
	}
	timescaleUrl := os.Getenv("SPN_TIMESCALE")
	if timescaleUrl == "" {
		setup.Exitf("SPN_TIMESCALE not set")
	}
	timescaleUrls := strings.Split(timescaleUrl, ",")
	seawaterAddr := strings.ToLower(os.Getenv("SPN_SEAWATER_ADDR"))
	if seawaterAddr == "" {
		setup.Exitf("SPN_SEAWATER_ADDR not set")
	}
	fusdcAddr := strings.ToLower(os.Getenv("SPN_FUSDC_ADDR"))
	if fusdcAddr == "" {
		setup.Exitf("SPN_FUSDC_ADDR not set")
	}
	return C{
		GethUrl:          gethUrl,
		TimescaleUrls:    timescaleUrls,
		SeawaterAddr:     types.AddressFromString(seawaterAddr),
		FusdcAddr:        types.AddressFromString(fusdcAddr),
		FusdcDecimals:    DefaultFusdcDecimals,
		FusdcTotalSupply: DefaultFusdcTotalSupply,
		FusdcSymbol:      DefaultFusdcSymbol,
		FusdcName:        DefaultFusdcName,
	}
}

func (c C) PickTimescaleUrl() string {
	return c.TimescaleUrls[rand.Intn(len(c.TimescaleUrls))]
}
