package leo

import (
	"bytes"
	_ "embed"
	"time"
	"fmt"
	"math/big"

	"github.com/fluidity-money/long.so/lib/types"

	ethAbi "github.com/ethereum/go-ethereum/accounts/abi"
	ethCommon "github.com/ethereum/go-ethereum/common"
)

var (
	TopicCampaignBalanceUpdated = abi.Events["CampaignBalanceUpdated"].ID
	TopicCampaignCreated        = abi.Events["CampaignCreated"].ID
	TopicCampaignUpdated = abi.Events["CampaignUpdated"].ID
)

//go:embed abi.json
var abiBytes []byte

var abi, _ = ethAbi.JSON(bytes.NewReader(abiBytes))

func hashToUnscaledNumber(h ethCommon.Hash) types.UnscaledNumber {
	// Always assumes the hash is well-formed.
	return types.UnscaledNumberFromBig(h.Big())
}

func UnpackCampaignBalanceUpdated(topic1, topic2, topic3 ethCommon.Hash, d []byte) (*CampaignBalanceUpdated, error) {
	return &CampaignBalanceUpdated{
		Identifier: hashToBytes8Data(topic1),
		NewMaximum: hashToUnscaledNumber(topic2),
	}, nil
}

// UnpackCampaignCreated events, also unpacking the packed "details"
// field to some of the extra bits of information we track
func UnpackCampaignCreated(topic1, topic2, topic3 ethCommon.Hash, d []byte) (*CampaignCreated, error) {
	i, err := abi.Unpack("CampaignCreated", d)
	if err != nil {
		return nil, err
	}
	details, ok := i[0].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad details: %T", i[0])
	}
	times, ok := i[1].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad times: %T", i[1])
	}
	tickLower, tickUpper, owner := unpackDetails(details)
	starting, ending := unpackTimes(times)
	return &CampaignCreated{
		Identifier: hashToBytes8Data(topic1),
		Pool:       hashToAddr(topic2),
		Token:      hashToAddr(topic3),
		TickLower:  tickLower,
		TickUpper:  tickUpper,
		Owner:      owner,
		Starting:   time.Unix(int64(starting), 0),
		Ending:     time.Unix(int64(ending), 0),
	}, nil
}

// UnpackCampaignUpdated happening with a new iteration of an existing
// campaign for a specific pool
func UnpackCampaignUpdated(topic1, topic2, topic3 ethCommon.Hash, d []byte) (*CampaignUpdated, error) {
	i, err := abi.Unpack("CampaignCreated", d)
	if err != nil {
		return nil, err
	}
	extras, ok := i[0].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad extras: %T", i[0])
	}
	tickLower, tickUpper, starting, ending := unpackExtras(extras)
	return &CampaignUpdated{
		Identifier: hashToBytes8Data(topic1),
		Pool:       hashToAddr(topic2),
		PerSecond: hashToNumber(topic3),
		TickLower:  tickLower,
		TickUpper:  tickUpper,
		Starting:   time.Unix(int64(starting), 0),
		Ending:     time.Unix(int64(ending), 0),
	}, nil
}

func hashToBytes8Data(t ethCommon.Hash) types.Data {
	b := t.Bytes()[:5]
	return types.DataFromBytes(b)
}

func hashToAddr(h ethCommon.Hash) types.Address {
	v := ethCommon.BytesToAddress(h.Bytes())
	return types.AddressFromString(v.String())
}

func hashToNumber(h ethCommon.Hash) types.Number {
	return types.NumberFromBig(h.Big())
}

func unpackDetails(i *big.Int) (tickLower int32, tickUpper int32, owner types.Address) {
	tickLower = int32(new(big.Int).Rsh(i, 32 + 160).Int64())
	tickUpper = int32(new(big.Int).Rsh(i, 160).Int64())
	owner = types.AddressFromString(ethCommon.BigToAddress(i).String())
	return
}

func unpackTimes(i *big.Int) (starting uint64, ending uint64) {
	starting = new(big.Int).Rsh(i, 64).Uint64()
	ending = i.Uint64()
	return
}

func unpackExtras(i *big.Int) (tickLower int32, tickUpper int32, starting uint64, ending uint64) {
	tickLower = int32(new(big.Int).Rsh(i, 32 + 64 + 64).Int64())
	tickUpper = int32(new(big.Int).Rsh(i, 64 + 64).Int64())
	starting = new(big.Int).Rsh(i, 64).Uint64()
	ending = i.Uint64()
	return
}
