package graph

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"slices"
	"strconv"
	"time"

	"github.com/fluidity-money/long.so/lib/features"
	"github.com/fluidity-money/long.so/lib/types"
	"github.com/fluidity-money/long.so/lib/types/erc20"
	"github.com/fluidity-money/long.so/lib/types/seawater"

	"github.com/fluidity-money/long.so/cmd/graphql.ethereum/graph/model"
)

var (
	// MaxMockedVolume for the random mocking of the volume/yield over time
	MaxMockedVolume, _ = new(big.Int).SetString("10000000000000000000000000000", 10)

	// MaxMockedPrice for the random mocking of the price/tvl/earned, divided by 1e5 for decimals
	MaxMockedPrice = new(big.Int).SetInt64(10000000000)

	// MinTick supported by the tick system of concentrated liquidity.
	MinTick = -887272

	// MaxTick of the inverted form of MinTick.
	MaxTick = -MinTick
)

// Five to reuse for the max integer
var Five = new(big.Int).SetInt64(5)

var ox65Price, _ = new(big.Int).SetString("79228162514264337593543950336", 10)

var (
	Tokens = map[string]model.Token{
		"0x65dfe41220c438bf069bbce9eb66b087fe65db36": {erc20.Erc20{
			Address:     types.AddressFromString("0x65dfe41220c438bf069bbce9eb66b087fe65db36"),
			Name:        "NEW_TOKEN_2",
			TotalSupply: mustUnscaled("10000000001000040000"), //10000000001000040000
			Decimals:    18,
			Symbol:      "NEW_TOKEN_2",
		}},
	}

	Pools = map[string]seawater.Pool{
		"0x65dfe41220c438bf069bbce9eb66b087fe65db36": {
			TransactionHash: "",             // TODO
			BlockNumber:     types.Number{}, // TODO
			Token:           types.AddressFromString("0x65dfe41220c438bf069bbce9eb66b087fe65db36"),
			Fee:             types.NumberFromBig(new(big.Int).SetInt64(0)),
		},
	}

	Positions = map[string][]seawater.Position{
		"0x65dfe41220c438bf069bbce9eb66b087fe65db36": {{
			TransactionHash: "",             // TODO
			BlockNumber:     types.Number{}, // TODO
			Id:              0,
			Owner:           types.AddressFromString("0xdca670597bcc35e11200fe07d9191a33a73850b9"),
			Pool:            types.AddressFromString("0x65dfe41220c438bf069bbce9eb66b087fe65db36"),
			Lower:           types.EmptyNumber(), // TODO
			Upper:           types.EmptyNumber(), // TODO
		}},
	}
)

func MockSeawaterPools() (pools []seawater.Pool) {
	pools = make([]seawater.Pool, len(Pools))
	var i int
	for _, v := range Pools {
		pools[i] = v
		i++
	}
	return
}

func MockGetPool(address string) (pool *seawater.Pool) {
	x := Pools[address]
	return &x
}

func MockGetPoolPositions(address types.Address) (positions model.SeawaterPositions) {
	a := address // Copy so we don't keep alive the scope above.
	return model.SeawaterPositions{
		From: 0,
		To:   nil,
		Pool: &a,
		// Wallet is unset here so we don't filter on it.
		Wallet:    nil,
		Positions: Positions[address.String()],
	}
}

func MockGetPosition(id int) (position *seawater.Position) {
L:
	for _, ps := range Positions {
		for _, p := range ps {
			if p.Id == id {
				x := p
				position = &x
				break L
			}
		}
	}
	return
}

func MockVolumeOverTime(period int, fusdc, token types.Address) (history []model.PairAmount, average *model.PairAmount, maximum *model.PairAmount, err error) {
	// Mock the volume over time, assuming that token1 will have
	// decimals of 18, and fusdc 6.

	// Using crypto/rand.Int to save myself from having a constant
	// word size using the pseudorandom number generator
	// (math/rand.Read)
	history = make([]model.PairAmount, period)
	t := time.Now()
	var (
		avgFusdc  = new(big.Int)
		avgToken1 = new(big.Int)
	)
	var (
		maxFusdc  = new(big.Int)
		maxToken1 = new(big.Int)
	)
	for i := 0; i < period; i++ {
		fusdcAmt, _ := rand.Int(rand.Reader, MaxMockedVolume)
		token1Amt, _ := rand.Int(rand.Reader, MaxMockedVolume)
		// Two years in the past plus the position we're at in the graph
		days := time.Duration(i*24) * time.Hour
		backThen := t.Add(-time.Duration(24 * time.Hour * 365)).Add(days)
		avgFusdc.Add(avgFusdc, fusdcAmt)
		avgToken1.Add(maxToken1, token1Amt)
		//maxFusdc < fusdcAmt
		if maxFusdc.Cmp(fusdcAmt) < 0 {
			maxFusdc.Set(fusdcAmt)
		}
		//maxToken1 < token1Amt
		if maxToken1.Cmp(token1Amt) < 0 {
			maxToken1.Set(token1Amt)
		}
		history[i] = model.PairAmount{
			Fusdc: model.Amount{
				Token:         fusdc,
				Decimals:      6,
				Timestamp:     int(backThen.Unix()), // This should be safe
				ValueUnscaled: types.UnscaledNumberFromBig(fusdcAmt),
			},
			Token1: model.Amount{
				Token:         token,
				Decimals:      18,
				Timestamp:     int(backThen.Unix()),
				ValueUnscaled: types.UnscaledNumberFromBig(token1Amt),
			},
		}
	}
	p := new(big.Int).SetInt64(int64(period))
	avgFusdc.Quo(avgFusdc, p)
	avgToken1.Quo(avgToken1, p)
	average = &model.PairAmount{
		Fusdc: model.Amount{
			Token:         fusdc,
			Decimals:      6,
			Timestamp:     int(t.Unix()),
			ValueUnscaled: types.UnscaledNumberFromBig(avgFusdc),
		},
		Timestamp: int(t.Unix()),
		Token1: model.Amount{
			Token:         token,
			Decimals:      18,
			Timestamp:     int(t.Unix()),
			ValueUnscaled: types.UnscaledNumberFromBig(avgFusdc),
		},
	}
	maximum = &model.PairAmount{
		Fusdc: model.Amount{
			Token:         fusdc,
			Decimals:      6,
			Timestamp:     int(t.Unix()),
			ValueUnscaled: types.UnscaledNumberFromBig(maxFusdc),
		},
		Timestamp: int(t.Unix()),
		Token1: model.Amount{
			Token:         token,
			Decimals:      18,
			Timestamp:     int(t.Unix()),
			ValueUnscaled: types.UnscaledNumberFromBig(maxToken1),
		},
	}
	return
}

func MockPriceOverTime(period int, fusdc, token types.Address) (history []string, average string, max string, err error) {
	history = make([]string, period)
	exp := new(big.Int).SetInt64(10)
	exp.Mul(exp, new(big.Int).SetInt64(4))
	avg := new(big.Float)
	max_ := new(big.Float)
	for i := 0; i < period; i++ {
		priceI, _ := rand.Int(rand.Reader, MaxMockedPrice)
		price := new(big.Float).SetInt(priceI)
		price.Quo(price, new(big.Float).SetInt(exp))
		avg.Add(avg, price)
		//if max < price
		if max_.Cmp(price) < 0 {
			max_.Set(price)
		}
		history[i] = fmt.Sprintf("%0.04f", price)
	}
	avg.Sub(avg, new(big.Float).SetInt64(int64(period)))
	average = fmt.Sprintf("%0.8f", avg)
	max = fmt.Sprintf("%0.8f", max_)
	return
}

func MockToken(address string) (model.Token, error) {
	return Tokens[address], nil
}

func MockSwaps(fusdc types.Address, amount int, pool types.Address) model.SeawaterSwaps {
	// Picks 150 random swaps, then sorts them according to the
	// timestamp (with all transactions being made less than a month ago randomly chosen.)
	// Assumes 6 as the decimals for fUSDC, and that the pool address is one that supports the
	// currently focused token.
	swaps := make([]model.SeawaterSwap, amount)
	now := time.Now()
	secsSinceLastMonth := new(big.Int).SetInt64(2678400) // 31 days in seconds
	tokenA := types.AddressFromString("0x65dfe41220c438bf069bbce9eb66b087fe65db36")
	tokenADecimals := Tokens[tokenA.String()].Decimals
	for i := 0; i < amount; i++ {
		ts, _ := rand.Int(rand.Reader, secsSinceLastMonth)
		ts.Sub(new(big.Int).SetInt64(now.Unix()), ts)
		t := time.Unix(ts.Int64(), 0)
		var (
			tokenIn, tokenOut                   types.Address
			amountInDecimals, amountOutDecimals int
		)
		if fusdcIsSender := randomBoolean(); fusdcIsSender {
			tokenIn = fusdc
			amountInDecimals = 6
			tokenOut = tokenA
			amountOutDecimals = tokenADecimals
		} else {
			tokenIn = tokenA
			amountInDecimals = tokenADecimals
			tokenOut = fusdc
			amountOutDecimals = 6
		}
		amountIn, _ := rand.Int(rand.Reader, MaxMockedVolume)
		amountOut, _ := rand.Int(rand.Reader, MaxMockedVolume)
		swaps[i] = model.SeawaterSwap{
			CreatedBy:        t, // This should be fine.
			Sender:           types.AddressFromString("0xdca670597bcc35e11200fe07d9191a33a73850b9"),
			TokenIn:          tokenIn,
			TokenInDecimals:  amountInDecimals,
			TokenOut:         tokenOut,
			TokenOutDecimals: amountOutDecimals,
			AmountIn:         types.UnscaledNumberFromBig(amountIn),
			AmountOut:        types.UnscaledNumberFromBig(amountOut),
		}
	}
	// Sort the remainder by the timestamps
	slices.SortFunc(swaps, func(x, y model.SeawaterSwap) int {
		return x.CreatedBy.Compare(x.CreatedBy)
	})
	p := pool
	pagination := model.SeawaterSwaps{
		From: 0,
		To:   amount,
		Pool: &p,
		// Wallet set to nil to make this about pools.
		Wallet: nil,
		Swaps:  swaps,
	}
	return pagination
}

// MockDelay for a random amount up to 5 seconds.
func MockDelay(f features.F) {
	f.On(features.FeatureGraphqlMockGraphDataDelay, func() error {
		d, _ := rand.Int(rand.Reader, Five)
		time.Sleep(time.Duration(d.Int64()) * time.Second)
		return nil
	})
}

func MockAmount() model.Amount {
	ta := "0x65dfe41220c438bf069bbce9eb66b087fe65db36"
	t := Tokens[ta]
	ts, _ := types.UnscaledNumberFromHex("17592186044416") // 100000000000
	return model.Amount{
		Token:         types.AddressFromString(ta),
		Decimals:      t.Decimals,
		Timestamp:     int(time.Now().Unix()),
		ValueUnscaled: *ts,
	}
}

func MockLiquidity(fusdc, token types.Address) (liquidity []model.SeawaterLiquidity) {
	tickSpread := 5000
	startingTick := MinTick
	maxTick := MaxTick
	for i := startingTick; i < maxTick; i += int(tickSpread) {
		tickLower := strconv.Itoa(i)
		tickUpper := strconv.Itoa(i + tickSpread)
		price, _ := rand.Int(rand.Reader, MaxMockedPrice)
		volume, _ := rand.Int(rand.Reader, MaxMockedVolume)
		liquidity = append(liquidity, model.SeawaterLiquidity{
			ID:        fmt.Sprintf("tick:%v:%v", tickLower, tickUpper),
			TickLower: tickLower,
			TickUpper: tickUpper,
			Price:     price.String(),  // Okay to have as a normal string. Supposed to be a float.
			Liquidity: volume.String(), // Same as price.
		})
	}
	return
}

func MockCampaigns() []model.LiquidityCampaign {
	return []model.LiquidityCampaign{{
		Pool: types.AddressFromString("0x65dfe41220c438bf069bbce9eb66b087fe65db36"),
		Token: Tokens["0x65dfe41220c438bf069bbce9eb66b087fe65db36"].Address,
		TickLower: -10,
		TickUpper: 100,
		Owner: types.AddressFromString("0xfeb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5"),
		Starting: time.Now(),
		Ending: time.Now().Add(100 * time.Hour),
	}}
}

func randomBoolean() bool {
	b := make([]byte, 1)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return uint8(b[0]) > 127
}

func mustUnscaled(s string) types.UnscaledNumber {
	x, err := types.UnscaledNumberFromBase10(s)
	if err != nil {
		panic(err)
	}
	return *x
}
