package leo

import (
	"testing"
	"math/big"

	"github.com/stretchr/testify/assert"

	"github.com/fluidity-money/long.so/lib/types"

	ethCommon "github.com/ethereum/go-ethereum/common"
)

func TestHashToBytes8Data(t *testing.T) {
	h := hashToBytes8Data(ethCommon.HexToHash("0x1999784708000000000000000000000000000000000000000000000000000000"))
	assert.Equal(t, types.DataFromString("0x1999784708"), h)
}

func TestUnpackDetails(t *testing.T) {
	//26959946541608605233643795350844886809526531442317004630100690334951
	lower, upper, owner := unpackDetails(new(big.Int).SetBits([]big.Word{
		8612231381554033895,
		429782047290621318,
		431143102912,
		4294967276,
	}))
	assert.Equalf(t, int32(-20), lower, "lower is wrong")
	assert.Equalf(t, int32(100), upper ,"upper is wrong")
	assert.Equalf(t,
		types.AddressFromString(ethCommon.HexToAddress("0x6221a9c005f6e47eb398fd867784cacfdcfff4e7").String()),
		owner,
		"owner is wrong",
	)
}

func TestUnpackTimes(t *testing.T) {
	starting, ending := unpackTimes(new(big.Int).SetBits([]big.Word{545464, 5000, 0, 0}))
	assert.Equalf(t, uint64(5000), starting, "starting not equal")
	assert.Equalf(t, uint64(545464), ending, "ending not equal")
}

func TestUnpackExtras(t *testing.T) {
//29230032814334249381340450918364660083204158393161
	tickLower, tickUpper, starting, ending := unpackExtras(new(big.Int).SetBits([]big.Word{
		2889,
		1888,
		85899346119,
		0,
	}))
	assert.Equalf(t, int32(20), tickLower, "lower is wrong")
	assert.Equalf(t, int32(199), tickUpper, "upper is wrong")
	assert.Equalf(t, uint64(1888), starting, "starting is wrong")
	assert.Equalf(t, uint64(2889), ending, "ending is wrong")
}
