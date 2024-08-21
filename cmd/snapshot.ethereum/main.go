package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log/slog"
	"math/big"
	"net/http"

	"github.com/fluidity-money/long.so/lib/config"
	"github.com/fluidity-money/long.so/lib/math"
	"github.com/fluidity-money/long.so/lib/setup"
	"github.com/fluidity-money/long.so/lib/types"
	"github.com/fluidity-money/long.so/lib/types/seawater"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	gormSlog "github.com/orandin/slog-gorm"
)

// PoolDetails retrieved from seawater_final_ticks_decimals_1
type PoolDetails struct {
	Pool      types.Address
	FinalTick types.Number
	Decimals  uint8
	curPrice  *big.Int // Set inside this program
}

var Zero = new(big.Int)

func main() {
	defer setup.Flush()
	config := config.Get()
	db, err := gorm.Open(postgres.Open(config.PickTimescaleUrl()), &gorm.Config{
		Logger: gormSlog.New(),
	})
	if err != nil {
		setup.Exitf("database open: %v", err)
	}
	slog.Debug("about to make another lookup")
	// Get every active position in the database, including the pools.
	var positions []seawater.Position
	err = db.Table("seawater_active_positions_1").
		Select("pos_id", "pool", "lower", "upper").
		Scan(&positions).
		Error
	if err != nil {
		setup.Exitf("seawater positions scan: %v", err)
	}
	slog.Debug("positions we're about to scan", "positions", positions)
	var poolDetails []PoolDetails
	// Get the decimals for each unique pool.
	err = db.Table("seawater_final_ticks_decimals_1").
		Select("final_tick", "pool", "decimals").
		Scan(&poolDetails).
		Error
	if err != nil {
		setup.Exitf("scan positions: %v", err)
	}
	slog.Debug("pools we're about to scan", "pools", poolDetails)
	poolMap := make(map[string]PoolDetails, len(poolDetails))
	for _, p := range poolDetails {
		poolMap[p.Pool.String()] = PoolDetails{
			Pool:      p.Pool,
			FinalTick: p.FinalTick,
			Decimals:  p.Decimals,
			curPrice:  math.GetSqrtRatioAtTick(p.FinalTick.Big()),
		}
	}
	// Store the positions in a map so we can reconcile the results
	// together easier. The key is a concatenation of the pool, and the
	// position id.
	positionMap := make(map[string]seawater.Position, len(positions))
	for _, p := range positions {
		positionMap[encodeId(p.Pool, p.Id)] = p
	}
	d := packRpcPosData(config.SeawaterAddr.String(), positionMap)
	// Request from the RPC the batched lookup of this data.
	// Makes multiple requests if the request size exceeds the current restriction.
	resps, err := reqPositions(context.Background(), config.GethUrl, d, httpPost)
	if err != nil {
		setup.Exitf("positions request: %v", err)
	}
	var (
		pools    = make([]string, len(positions))
		ids      = make([]int, len(positions))
		amount0s = make([]string, len(positions))
		amount1s = make([]string, len(positions))
	)
	i := 0
	for _, r := range resps {
		pos, ok := positionMap[r.Key]
		if !ok {
			slog.Info("position doesn't have any liquidity",
				"position id", pos.Id,
			)
			continue
		}
		poolAddr := pos.Pool.String()
		var (
			lowerPrice = math.GetSqrtRatioAtTick(pos.Lower.Big())
			upperPrice = math.GetSqrtRatioAtTick(pos.Upper.Big())
		)
		amount0Rat, amount1Rat := math.GetAmountsForLiq(
			poolMap[poolAddr].curPrice, // The current sqrt ratio
			lowerPrice,
			upperPrice,
			r.Delta.Big(),
		)
		var (
			amount0 = mulRatToInt(amount0Rat, config.FusdcDecimals)
			amount1 = mulRatToInt(amount1Rat, int(poolMap[poolAddr].Decimals))
		)
		slog.Debug("price data",
			"pool", poolAddr,
			"id", pos.Id,
			"amount0", amount0Rat.FloatString(10),
			"amount1", amount1Rat.FloatString(10),
			"amount0", amount0.String(),
			"amount1", amount1.String(),
			"delta", r.Delta.String(),
			"lower", lowerPrice,
			"upper", upperPrice,
		)
		if amount0.Cmp(Zero) == 0 && amount1.Cmp(Zero) == 0 {
			continue
		}
		pools[i] = poolAddr
		ids[i] = pos.Id
		amount0s[i] = amount0.String()
		amount1s[i] = amount1.String()
		i++
	}
	if len(ids) == 0 {
		slog.Info("no positions found")
		return
	}
	err = storePositions(
		db,
		pools[:i],
		ids[:i],
		amount0s[:i],
		amount1s[:i],
	)
	if err != nil {
		setup.Exitf("store positions: %v", err)
	}
}

func httpPost(url string, contentType string, r io.Reader) (io.ReadCloser, error) {
	resp, err := http.Post(url, "application/json", r)
	if err != nil {
		return nil, err
	}
	switch s := resp.StatusCode; s {
	case http.StatusOK:
		// Do nothing
	default:
		var buf bytes.Buffer
		defer resp.Body.Close()
		if _, err := buf.ReadFrom(resp.Body); err != nil {
			return nil, fmt.Errorf("bad resp drain: %v", err)
		}
		return nil, fmt.Errorf("bad resp status %#v: %v", buf.String(), s)
	}
	return resp.Body, nil
}

func mulRatToInt(x *big.Rat, d int) *big.Int {
	i := new(big.Int).Quo(x.Num(), x.Denom())
	return i
}
