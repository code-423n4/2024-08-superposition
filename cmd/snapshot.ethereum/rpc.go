package main

import (
	"bytes"
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math/big"
	"math/rand"
	"strconv"
	"strings"

	"github.com/fluidity-money/long.so/lib/types"
	"github.com/fluidity-money/long.so/lib/types/seawater"

	ethCommon "github.com/ethereum/go-ethereum/common"
)

const (
	// MinBatchLimit to get from the server before using multiple batches.
	// This is the minimum that will be used.
	MinBatchLimit = 100

	// MaxBatchLimit to get from the server before using multiple
	// batches. Half of the maximum amount since upstream started to
	// choke.
	MaxBatchLimit = 200

	// WorkerCount of simultaneous requests that can be made max.
	WorkerCount = 100
)

type (
	rpcReq struct {
		JsonRpc string `json:"jsonrpc"`
		Id      string `json:"id"`
		Method  string `json:"method"`
		Params  []any  `json:"params"`
	}

	rpcResp struct {
		Id     string `json:"id"`
		Result string `json:"result"`
		Error  any    `json:"error"`
	}

	// posResp that's also given to gorm to be used with a custom
	// function that does a left join during insertion.
	posResp struct {
		Key   string
		Delta types.Number
	}
)

// packRpcPosData by concatenating the pool address with the position id, so
// we can quickly unpack it later. Assumes poolAddr, and ammAddr, are
// correctly formatted (0x[A-Za-z0-9]{40}).
func packRpcPosData(ammAddr string, positions map[string]seawater.Position) (req []rpcReq) {
	req = make([]rpcReq, len(positions))
	i := 0
	for k, p := range positions {
		s := getCalldata(p.Pool, p.Id)
		req[i] = rpcReq{
			JsonRpc: "2.0",
			Id:      k,
			Method:  "eth_call",
			Params: []any{
				map[string]string{
					"to":   ammAddr,
					"data": s,
				},
				"latest",
			},
		}
		i++
	}
	return
}

type HttpReqFn func(url, contentType string, r io.Reader) (io.ReadCloser, error)

// reqPositions by querying the RPC provider with the requested
// positions. Returns the pool and the ID by splitting the retured ID up.
// Batches the response and uses an internal goroutine group if the
// request is above the batch limit. If it encounters a situation where
// anything is returned in error, it sends a done message to all the
// Goroutines after attempting to drain them for 5 seconds.
func reqPositions(ctx context.Context, url string, reqs []rpcReq, makeReq HttpReqFn) ([]posResp, error) {
	var (
		chanReqs  = make(chan []rpcReq)
		chanResps = make(chan posResp)
		chanErrs  = make(chan error)
		chanDone  = make(chan bool)
	)
	// Figure out the maximum number of goroutines that we can run to
	// make the requests. Scaling up accordingly.
	batchLimit := rand.Intn(MaxBatchLimit-MinBatchLimit) + MinBatchLimit
	slog.Info("sending requests using a randomly chosen batch limit",
		"batch limit", batchLimit,
	)
	frames := len(reqs) / batchLimit
	workerCount := max(frames, WorkerCount)
	for i := 0; i < workerCount; i++ {
		go func() {
			for {
				select {
				case <-chanDone:
					// Time to stop processing. An error happened externally/we finished.
					return
				case r := <-chanReqs:
					var buf bytes.Buffer
					if err := json.NewEncoder(&buf).Encode(r); err != nil {
						chanErrs <- fmt.Errorf("encoding json: %v", err)
						return
					}
					// Make the request, then unpack the data to send back.
					resp, err := makeReq(url, "application/json", &buf)
					if err != nil {
						chanErrs <- fmt.Errorf("request: %v", err)
						return
					}
					if resp == nil {
						chanErrs <- fmt.Errorf("empty rpc resp: %v", err)
						return
					}
					defer resp.Close()
					var resps []rpcResp
					if err := json.NewDecoder(resp).Decode(&resps); err != nil {
						chanErrs <- fmt.Errorf("decoding: %v", err)
						return
					}
					for _, p := range resps {
						if err := p.Error; err != nil {
							chanErrs <- fmt.Errorf(`error reported: %v`, err)
							return
						}
						delta, err := types.NumberFromHex(strings.TrimPrefix(p.Result, "0x"))
						if err != nil {
							chanErrs <- fmt.Errorf("unpacking delta: %#v: %v", p, err)
							return
						}
						r := posResp{p.Id, *delta}
						select {
						case <-chanDone:
							return // Hopefully this will prevent us from going through the rest.
						case chanResps <- r:
							// Do nothing. We sent.
						}
					}
				}
			}
		}()
	}
	go func() {
		b := make([]rpcReq, batchLimit)
		x := 0
		for _, p := range reqs {
			b[x] = p
			x++
			if x != batchLimit {
				continue
			}
			c := make([]rpcReq, batchLimit)
			for i := 0; i < batchLimit; i++ {
				c[i] = b[i]
			}
			select {
			case <-chanDone:
				return // We're done!
			case chanReqs <- c:
			}
			x = 0
		}
		if x > 0 {
			c := make([]rpcReq, x)
			// Copy the array so we don't have duplication.
			for i := 0; i < x; i++ {
				c[i] = b[i]
			}
			select {
			case <-chanDone:
				return // We're done!
			case chanReqs <- c:
			}

		}
	}()
	resps := make([]posResp, len(reqs))
	sleepRoutines := func() {
		for {
			chanDone <- true
		}
	}
	// Start to unpack everything/signal the worker group if we have an error.
	for i := 0; i < len(reqs); i++ {
		select {
		case resp := <-chanResps:
			resps[i] = resp
		case <-ctx.Done():
			go sleepRoutines()
			return nil, ctx.Err()
		case err := <-chanErrs:
			// Orphan a goroutine to spam done to the children.
			go sleepRoutines()
			return nil, err
		}
	}
	return resps, nil
}

func decodeId(x string) (pool types.Address, id int, ok bool) {
	if len(x) < 40 {
		return "", 0, false
	}
	pool = types.AddressFromString(x[:42])
	var err error
	id_, err := strconv.ParseInt(x[42:], 16, 64)
	if err != nil {
		return "", 0, false
	}
	id = int(id_)
	return pool, id, true
}

func encodeId(pool types.Address, id int) string {
	return fmt.Sprintf("%s%x", pool, id)
}

func getCalldata(pool types.Address, posId int) string {
	posIdB := new(big.Int).SetInt64(int64(posId)).Bytes()
	x := append(
		//positionLiquidity8D11C045(address,uint256)
		[]byte{0, 0, 0x02, 0x5b},
		append(
			ethCommon.LeftPadBytes(ethCommon.HexToAddress(pool.String()).Bytes(), 32),
			ethCommon.LeftPadBytes(posIdB, 32)...,
		)...,
	)
	return "0x" + hex.EncodeToString(x)
}
