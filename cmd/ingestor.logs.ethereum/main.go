package main

import (
	"log/slog"
	"math/rand"
	"os"

	"github.com/fluidity-money/long.so/lib/setup"

	"github.com/fluidity-money/long.so/lib/config"
	"github.com/fluidity-money/long.so/lib/features"
	"github.com/fluidity-money/long.so/lib/types"

	_ "github.com/lib/pq"

	gormSlog "github.com/orandin/slog-gorm"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/ethereum/go-ethereum/ethclient"
)

const (
	EnvThirdwebAddr = "SPN_THIRDWEB_ACCOUNT_FACTORY_ADDR"
	EnvLeoAddr = "SPN_LEO_ADDR"
)

const (
	// DefaultPaginationBlockCountMin to use as the minimum number of blocks
	// to increase by.
	DefaultPaginationBlockCountMin = 1000

	// DefaultPaginationBlockCountMax to increase the last known block tracked
	// by with.
	DefaultPaginationBlockCountMax = 5000

	// DefaultPaginationPollWait to wait between polls.
	DefaultPaginationPollWait = 4 // Seconds
)

func main() {
	defer setup.Flush()
	config := config.Get()
	db, err := gorm.Open(postgres.Open(config.PickTimescaleUrl()), &gorm.Config{
		Logger: gormSlog.New(),
	})
	if err != nil {
		setup.Exitf("opening postgres: %v", err)
	}
	// Start to ingest block headers by connecting to the websocket given.
	c, err := ethclient.Dial(config.GethUrl)
	if err != nil {
		setup.Exitf("websocket dial: %v", err)
	}
	defer c.Close()
	ingestorPagination := rand.Intn(DefaultPaginationBlockCountMax-DefaultPaginationBlockCountMin) + DefaultPaginationBlockCountMin
	slog.Info("polling configuration",
		"poll wait time amount", DefaultPaginationPollWait,
		"pagination block count min", DefaultPaginationBlockCountMin,
		"pagination block count max", DefaultPaginationBlockCountMax,
		"pagination count", ingestorPagination,
	)
	thirdwebFactoryAddr_ := os.Getenv(EnvThirdwebAddr)
	if thirdwebFactoryAddr_ == "" {
		setup.Exitf("%v not set", EnvThirdwebAddr)
	}
	thirdwebFactoryAddr := types.AddressFromString(thirdwebFactoryAddr_)
	leoAddr_ := os.Getenv(EnvLeoAddr)
	if leoAddr_ == "" {
		setup.Exitf("%v not set", EnvLeoAddr)
	}
	leoAddr := types.AddressFromString(leoAddr_)
	Entry(
		features.Get(),
		config,
		thirdwebFactoryAddr,
		leoAddr,
		ingestorPagination,
		DefaultPaginationPollWait,
		c,
		db,
	)
}
