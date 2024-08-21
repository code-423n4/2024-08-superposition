package thirdweb

import (
	"bytes"
	_ "embed"

	"github.com/fluidity-money/long.so/lib/types"

	ethCommon "github.com/ethereum/go-ethereum/common"
	ethAbi "github.com/ethereum/go-ethereum/accounts/abi"
)

//go:embed abi.json
var abiBytes []byte

var abi, _ = ethAbi.JSON(bytes.NewReader(abiBytes))

// TopicAccountCreated emitted by Account
var TopicAccountCreated = abi.Events["AccountCreated"].ID

func UnpackAccountCreated(topic1, topic2 ethCommon.Hash, d []byte) (*AccountCreated, error) {
	var (
		account      = hashToAddr(topic1)
		accountAdmin = hashToAddr(topic2)
	)
	return &AccountCreated{
		Account:      account,
		AccountAdmin: accountAdmin,
	}, nil
}

func hashToAddr(h ethCommon.Hash) types.Address {
	v := ethCommon.BytesToAddress(h.Bytes())
	return types.AddressFromString(v.String())
}
