package model

import (
	"testing"

	"github.com/fluidity-money/long.so/lib/types"
	"github.com/stretchr/testify/assert"
)

func TestPriceResultPrice(t *testing.T) {
	var (
		p = PriceResult{
			FinalTick: types.NumberFromInt64(-198101),
		}
		fusdcDecimals = 6
		poolDecimals  = 18
		expected      = "2494.66955"
	)

	price := p.Price(fusdcDecimals, poolDecimals)
	assert.Equal(t, expected, price)

	p = PriceResult{
		FinalTick: types.NumberFromInt64(123),
	}
	fusdcDecimals = 6
	poolDecimals = 6
	expected = "1.012375"
}
