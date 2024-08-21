package graph

import (
	"context"
	"fmt"
	"regexp"

	"github.com/ethereum/go-ethereum/ethclient"
	ethCommon "github.com/ethereum/go-ethereum/common"
)

// reWallet to use to validate the wallet address before continuing with verification.
var reWallet = regexp.MustCompile("(0x)?[A-Z0-9a-z]{40}")

func IsValidWallet(a string) bool {
	if !reWallet.MatchString(a) {
		return false
	}
	return ethCommon.IsHexAddress(a)
}

// IsContract test by checking the contract size with Geth to see if it's greater than 0.
func IsContract(c *ethclient.Client, ctx context.Context, a ethCommon.Address) (bool, error) {
	b, err := c.CodeAt(ctx, a, nil)
	if err != nil {
		return false, fmt.Errorf("bad code at: %v", err)
	}
	isContract := len(b) > 0
	return isContract, nil
}
