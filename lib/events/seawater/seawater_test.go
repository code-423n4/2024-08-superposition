package seawater

import (
	"encoding/hex"
	"testing"

	"github.com/fluidity-money/long.so/lib/types"

	ethCommon "github.com/ethereum/go-ethereum/common"

	"github.com/stretchr/testify/assert"
)

func TestUnpackMintPosition1(t *testing.T) {
	var (
		topic1 = ethCommon.HexToHash("0x0000000000000000000000000000000000000000000000000000000000000000")
		topic2 = ethCommon.HexToHash("0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5")
		topic3 = ethCommon.HexToHash("0x0000000000000000000000002f26b901590801476c5bac1debc4e42379127a44")
	)
	d, err := hex.DecodeString("00000000000000000000000000000000000000000000000000000000000098d2000000000000000000000000000000000000000000000000000000000000c3bc")
	if err != nil {
		t.Fatalf("failed to decode string: %v", err)
	}
	p, err := UnpackMintPosition(topic1, topic2, topic3, d)
	if err != nil {
		t.Fatalf("unpack mint position: %v", err)
	}
	assert.Equalf(t, 0, p.PosId, "id was not zero")
	assert.Equalf(t,
		types.AddressFromString("0xfeb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5"),
		p.Owner,
		"address not equal",
	)
	assert.Equalf(t,
		types.AddressFromString("0x2f26b901590801476c5bac1debc4e42379127a44"),
		p.Pool,
		"pool not equal",
	)
	assert.Equal(t,
		types.NumberFromInt64(39122),
		p.Lower,
		"lower not equal",
	)
	assert.Equal(t,
		types.NumberFromInt64(50108),
		p.Upper,
		"upper not equal",
	)
}

func TestMintPosition2(t *testing.T) {
	var (
		topic1 = ethCommon.HexToHash("0x0000000000000000000000000000000000000000000000000000000000000000")
		topic2 = ethCommon.HexToHash("0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5")
		topic3 = ethCommon.HexToHash("0x000000000000000000000000e984f758f362d255bd96601929970cef9ff19dd7")
	)
	d, err := hex.DecodeString("000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d89e8")
	if err != nil {
		t.Fatalf("failed to decode string: %v", err)
	}
	p, err := UnpackMintPosition(topic1, topic2, topic3, d)
	if err != nil {
		t.Fatalf("unpack mint position: %v", err)
	}
	assert.Equalf(t, 0, p.PosId, "id was not zero")
	assert.Equalf(t,
		types.AddressFromString("0xfeb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5"),
		p.Owner,
		"address not equal",
	)
	assert.Equalf(t,
		types.AddressFromString("0xe984f758f362d255bd96601929970cef9ff19dd7"),
		p.Pool,
		"pool not equal",
	)
	assert.Equal(t,
		types.NumberFromInt64(0),
		p.Lower,
		"lower not equal",
	)
	assert.Equal(t,
		types.NumberFromInt64(887272),
		p.Upper,
		"upper not equal",
	)
}

func TestUnpackBurnPosition(t *testing.T) {
}

func TestUnpackPositionLiquidity(t *testing.T) {
}

func TestUnpackCollectFees(t *testing.T) {

}

func TestUnpackNewPool(t *testing.T) {
	var (
		topic1 = ethCommon.HexToHash("0x0000000000000000000000003f511b0f5ce567899deee6a3c80a2742272687d0")
		topic2 = ethCommon.HexToHash("0x0000000000000000000000000000000000000000000000000000000000000000")
		topic3 = ethCommon.HexToHash("0x0000000000000000000000000000000000000000000000000000000000000000") // topic3 is not used.
	)
	d, err := hex.DecodeString("00000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000001")
	if err != nil {
		t.Fatalf("failed to decode string: %v", err)
	}
	p, err := UnpackNewPool(topic1, topic2, topic3, d)
	if err != nil {
		t.Fatalf("unpack mint position: %v", err)
	}
	assert.Equalf(t,
		types.AddressFromString("0x3f511b0f5ce567899deee6a3c80a2742272687d0"),
		p.Token,
		"token not equal",
	)
	assert.Equalf(t, uint32(0), p.Fee, "fee not equal")
	assert.Equalf(t, uint8(6), p.Decimals, "decimals not equal")
	assert.Equalf(t, uint8(1), p.TickSpacing, "tick spacing not equal")
}

func TestUnpackCollectProtocolFees(t *testing.T) {

}

func TestUnpackSwap2(t *testing.T) {}

func TestUnpackSwap1(t *testing.T) {
	var (
		topic1 = ethCommon.HexToHash("0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5")
		topic2 = ethCommon.HexToHash("0x000000000000000000000000e984f758f362d255bd96601929970cef9ff19dd7")
	)
	d, err := hex.DecodeString("000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000a9fe")
	if err != nil {
		t.Fatalf("failed to decode string: %v", err)
	}
	s, err := UnpackSwap1(topic1, topic2, d)
	if err != nil {
		t.Fatalf("unpack mint position: %v", err)
	}
	assert.Equalf(t,
		types.AddressFromString("0xFEb6034FC7dF27dF18a3a6baD5Fb94C0D3dCb6d5"),
		s.User,
		"token not equal",
	)
	assert.Equalf(t,
		types.AddressFromString("0xe984f758F362D255Bd96601929970Cef9Ff19dD7"),
		s.Pool,
		"pool not equal",
	)
	assert.Falsef(t, s.ZeroForOne, "zeroforone incorrect")
	assert.Equalf(t,
		types.UnscaledNumberFromInt64(1),
		s.Amount0,
		"amount0 not equal",
	)
	assert.Equalf(t,
		types.UnscaledNumberFromInt64(100),
		s.Amount1,
		"amount1 not equal",
	)
	assert.Equalf(t,
		types.NumberFromInt64(43518),
		s.FinalTick,
		"final tick not equal",
	)
}
