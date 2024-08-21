package erc20

import (
	"bytes"
	_ "embed"
	"fmt"
	"math/big"

	"github.com/fluidity-money/long.so/lib/types"

	ethAbi "github.com/ethereum/go-ethereum/accounts/abi"
	ethCommon "github.com/ethereum/go-ethereum/common"
)

//go:embed abi.json
var abiBytes []byte

var abi, _ = ethAbi.JSON(bytes.NewReader(abiBytes))

// TopicTransfer emitted by Transfer(address,uint256)
var TopicTransfer = abi.Events["Transfer"].ID

func UnpackTransfer(topic1, topic2 ethCommon.Hash, d []byte) (*Transfer, error) {
	amount := new(big.Int) // Set to 0 as default, if the data is empty it will be 0
	if len(d) > 0 {
		i, err := abi.Unpack("Transfer", d)
		if err != nil {
			return nil, err
		}
		var ok bool
		amount, ok = i[0].(*big.Int)
		if !ok {
			return nil, fmt.Errorf("bad amount: %T", i[0])
		}
	}
	return &Transfer{
		Sender:    hashToAddr(topic1),
		Recipient: hashToAddr(topic2),
		Value:     types.UnscaledNumberFromBig(amount),
	}, nil
}

func hashToAddr(h ethCommon.Hash) types.Address {
	v := ethCommon.BytesToAddress(h.Bytes())
	return types.Address(v.String())
}
