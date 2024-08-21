package seawater

import (
	"bytes"
	_ "embed"
	"fmt"
	"math/big"

	"github.com/fluidity-money/long.so/lib/types"

	ethAbi "github.com/ethereum/go-ethereum/accounts/abi"
	ethCommon "github.com/ethereum/go-ethereum/common"
)

var (
	TopicMintPosition            = abi.Events["MintPosition"].ID
	TopicBurnPosition            = abi.Events["BurnPosition"].ID
	TopicTransferPosition        = abi.Events["TransferPosition"].ID
	TopicUpdatePositionLiquidity = abi.Events["UpdatePositionLiquidity"].ID
	TopicCollectFees             = abi.Events["CollectFees"].ID
	TopicNewPool                 = abi.Events["NewPool"].ID
	TopicCollectProtocolFees     = abi.Events["CollectProtocolFees"].ID
	TopicSwap2                   = abi.Events["Swap2"].ID
	TopicSwap1                   = abi.Events["Swap1"].ID
)

//go:embed abi.json
var abiBytes []byte

var abi, _ = ethAbi.JSON(bytes.NewReader(abiBytes))

func UnpackMintPosition(topic1, topic2, topic3 ethCommon.Hash, d []byte) (*MintPosition, error) {
	i, err := abi.Unpack("MintPosition", d)
	if err != nil {
		return nil, err
	}
	lower, ok := i[0].(int32)
	if !ok {
		return nil, fmt.Errorf("bad lower: %T", i[0])
	}
	upper, ok := i[1].(int32)
	if !ok {
		return nil, fmt.Errorf("bad upper: %T", i[1])
	}
	posId, err := hashToInt(topic1)
	if err != nil {
		return nil, err
	}
	return &MintPosition{
		PosId: posId,
		Owner: hashToAddr(topic2),
		Pool:  hashToAddr(topic3),
		Lower: types.NumberFromInt32(lower),
		Upper: types.NumberFromInt32(upper),
	}, nil
}

func UnpackBurnPosition(topic1, topic2 ethCommon.Hash, d []byte) (*BurnPosition, error) {
	posId, err := hashToInt(topic1)
	if err != nil {
		return nil, err
	}
	return &BurnPosition{
		PosId: posId,
		Owner: hashToAddr(topic2),
	}, nil
}

func UnpackTransferPosition(topic1, topic2, topic3 ethCommon.Hash, d []byte) (*TransferPosition, error) {
	posId, err := hashToInt(topic3)
	if err != nil {
		return nil, err
	}
	return &TransferPosition{
		PosId: posId,
		From:  hashToAddr(topic1),
		To:    hashToAddr(topic2),
	}, nil
}

func UnpackUpdatePositionLiquidity(topic1, topic2 ethCommon.Hash, d []byte) (*UpdatePositionLiquidity, error) {
	posId, err := hashToInt(topic1)
	if err != nil {
		return nil, err
	}
	i, err := abi.Unpack("UpdatePositionLiquidity", d)
	if err != nil {
		return nil, err
	}
	token0, ok := i[0].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad token0: %T", i[1])
	}
	token1, ok := i[1].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad token1: %T", i[2])
	}
	return &UpdatePositionLiquidity{
		PosId: posId,
		Token0: types.UnscaledNumberFromBig(token0),
		Token1: types.UnscaledNumberFromBig(token1),
	}, nil
}

func UnpackCollectFees(topic1, topic2, topic3 ethCommon.Hash, d []byte) (*CollectFees, error) {
	i, err := abi.Unpack("CollectFees", d)
	if err != nil {
		return nil, err
	}
	amount0, ok := i[0].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad amount0: %T", i[1])
	}
	amount1, ok := i[1].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad amount1: %T", i[2])
	}
	posId, err := hashToInt(topic1)
	if err != nil {
		return nil, err
	}
	return &CollectFees{
		PosId:   posId,
		Pool:    hashToAddr(topic2),
		To:      hashToAddr(topic3),
		Amount0: types.UnscaledNumberFromBig(amount0),
		Amount1: types.UnscaledNumberFromBig(amount1),
	}, nil
}

func UnpackNewPool(topic1, topic2, topic3 ethCommon.Hash, d []byte) (*NewPool, error) {
	fee := uint32(topic2.Big().Int64()) // This should be safe given the size in the event.
	i, err := abi.Unpack("NewPool", d)
	if err != nil {
		return nil, err
	}
	decimals, ok := i[0].(uint8)
	if !ok {
		return nil, fmt.Errorf("bad amount0: %T", i[0])
	}
	tickSpacing, ok := i[1].(uint8)
	if !ok {
		return nil, fmt.Errorf("bad tickSpacing: %T", i[1])
	}
	return &NewPool{
		Token:       hashToAddr(topic1),
		Fee:         fee,
		Decimals:    decimals,
		TickSpacing: tickSpacing,
	}, nil
}

func UnpackCollectProtocolFees(topic1, topic2 ethCommon.Hash, d []byte) (*CollectProtocolFees, error) {
	i, err := abi.Unpack("CollectProtocolFees", d)
	if err != nil {
		return nil, err
	}
	amount0, ok := i[0].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad amount0: %T", i[0])
	}
	amount1, ok := i[1].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad amount1: %T", i[1])
	}
	return &CollectProtocolFees{
		Pool:    hashToAddr(topic1),
		To:      hashToAddr(topic2),
		Amount0: types.UnscaledNumberFromBig(amount0),
		Amount1: types.UnscaledNumberFromBig(amount1),
	}, nil
}

func UnpackSwap2(topic1, topic2, topic3 ethCommon.Hash, d []byte) (*Swap2, error) {
	i, err := abi.Unpack("Swap2", d)
	if err != nil {
		return nil, err
	}
	amountIn, ok := i[0].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad amountIn: %T", i[1])
	}
	amountOut, ok := i[1].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad amountOut: %T", i[2])
	}
	fluidVolume, ok := i[2].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad fluidVolume: %T", i[3])
	}
	finalTick0, ok := i[3].(int32)
	if !ok {
		return nil, fmt.Errorf("bad finalTick0: %T", i[4])
	}
	finalTick1, ok := i[4].(int32)
	if !ok {
		return nil, fmt.Errorf("bad finalTick1: %T", i[5])
	}
	return &Swap2{
		User:        hashToAddr(topic1),
		From:        hashToAddr(topic2),
		To:          hashToAddr(topic3),
		AmountIn:    types.UnscaledNumberFromBig(amountIn),
		AmountOut:   types.UnscaledNumberFromBig(amountOut),
		FluidVolume: types.UnscaledNumberFromBig(fluidVolume),
		FinalTick0:  types.NumberFromInt64(int64(finalTick0)),
		FinalTick1:  types.NumberFromInt64(int64(finalTick1)),
	}, nil
}

func UnpackSwap1(topic1, topic2 ethCommon.Hash, d []byte) (*Swap1, error) {
	i, err := abi.Unpack("Swap1", d)
	if err != nil {
		return nil, err
	}
	zeroForOne, ok := i[0].(bool)
	if !ok {
		return nil, fmt.Errorf("bad zeroForOne: %T", i[0])
	}
	amount0, ok := i[1].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad amount0: %T", i[1])
	}
	amount1, ok := i[2].(*big.Int)
	if !ok {
		return nil, fmt.Errorf("bad amount1: %T", i[2])
	}
	finalTick_, ok := i[3].(int32)
	if !ok {
		return nil, fmt.Errorf("bad finalTick: %T", i[3])
	}
	finalTick := new(big.Int).SetInt64(int64(finalTick_))
	return &Swap1{
		User:       hashToAddr(topic1),
		Pool:       hashToAddr(topic2),
		ZeroForOne: zeroForOne,
		Amount0:    types.UnscaledNumberFromBig(amount0),
		Amount1:    types.UnscaledNumberFromBig(amount1),
		FinalTick:  types.NumberFromBig(finalTick),
	}, nil
}

func hashToNumber(h ethCommon.Hash) types.Number {
	// Always assumes the hash is well-formed.
	return types.NumberFromBig(h.Big())
}
func hashToInt(h ethCommon.Hash) (int, error) {
	// Makes an assumption that we're not going to exceed the limit on this.
	i := hashToNumber(h)
	if !i.IsInt64() { // Too large!
		return 0, fmt.Errorf("too large: %#v", i.String())
	}
	return int(i.Int64()), nil
}

func hashToAddr(h ethCommon.Hash) types.Address {
	v := ethCommon.BytesToAddress(h.Bytes())
	return types.AddressFromString(v.String())
}

func ethAddrToAddr(a ethCommon.Address) types.Address {
	return types.AddressFromString(a.String())
}
