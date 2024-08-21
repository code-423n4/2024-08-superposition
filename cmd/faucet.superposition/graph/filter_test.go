package graph

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsValidWallet(t *testing.T) {
	ok := IsValidWallet("0x6221a9c005f6e47eb398fd867784cacfdcfff4e7")
	assert.Truef(t, ok, "bad wallet filtering")
}

func TestInvalidWallet(t *testing.T) {
	ok := IsValidWallet("swag")
	assert.Falsef(t, ok, "bad wallet filtering")
}
