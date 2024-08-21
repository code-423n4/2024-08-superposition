package math

import (
	"math/big"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExponentiateDecimals(t *testing.T) {
	decimals := ExponentiateDecimals(6)
	expected := big.NewRat(1000000, 1)
	assert.Equal(t, expected, decimals)

	decimals = ExponentiateDecimals(18)
	expected = big.NewRat(1000000000000000000, 1)
	assert.Equal(t, expected, decimals)
}
