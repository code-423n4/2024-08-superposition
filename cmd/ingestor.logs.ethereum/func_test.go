package main

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/fluidity-money/long.so/lib/events/seawater"
	"github.com/fluidity-money/long.so/lib/events/thirdweb"
	"github.com/fluidity-money/long.so/lib/types"

	ethCommon "github.com/ethereum/go-ethereum/common"
	ethTypes "github.com/ethereum/go-ethereum/core/types"

	"github.com/stretchr/testify/assert"
)

// EmptyAddr for testing reasons
var EmptyAddr ethCommon.Address

func TestHandleLogCallbackNewPool(t *testing.T) {
	// Test the new pool handling code.
	seawaterAddr := ethCommon.HexToAddress("0x0fFC26C47FeD8C54AF2f0872cc51d79D173730a8")
	s := strings.NewReader(`
{
	"address": "0x0ffc26c47fed8c54af2f0872cc51d79d173730a8",
	"topics": [
		"0xcb076a66f4dca163de39a4023de987ca633a005767c796b3772e3462c573e339",
		"0x0000000000000000000000003f511b0f5ce567899deee6a3c80a2742272687d0",
		"0x0000000000000000000000000000000000000000000000000000000000000000"
	],
	"data": "0x00000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000001",
	"blockNumber": "0xa5a3",
	"transactionHash": "0xb2774f9d137158c9982a54764d9c2ec3fd5f3da3bc73e4937a37d29d8531d255",
	"transactionIndex": "0x1",
	"blockHash": "0x4ea3b2f32d398c23f3278fbb6fe1e74ad21a9216a9d2c8b366b6b6fe87702017",
	"logIndex": "0x0",
	"removed": false
}`)
	var l ethTypes.Log
	assert.Nilf(t, json.NewDecoder(s).Decode(&l), "failed to decode log")
	wasRun := false
	handleLogCallback(seawaterAddr, EmptyAddr, EmptyAddr, l, func(table string, a any) error {
		assert.Equalf(t, "events_seawater_newpool", table, "table not equal")
		// This test is captured in a unit test, so we can focus on just testing
		// this one field.
		newPool, ok := a.(*seawater.NewPool)
		assert.Truef(t, ok, "NewPool type coercion not true")
		assert.Equalf(t,
			types.AddressFromString("0x3f511b0f5ce567899deee6a3c80a2742272687d0"),
			newPool.Token,
			"token not equal",
		)
		wasRun = true
		return nil
	})
	assert.True(t, wasRun)
}

func TestHandleLogCallbackUpdatePositionLiquidity(t *testing.T) {
	seawaterAddr := ethCommon.HexToAddress("0x839c5cf32d9bc2cd46027691d2941410251ed557")
	s := strings.NewReader(`
{
	"address": "0x839c5cf32d9bc2cd46027691d2941410251ed557",
	"blockHash": "0xc6c5a097fa5983067a5604e557f0a748d20d6569d33ca76ec52ba242abbae864",
	"blockNumber": "0x4fa7dc",
	"data": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
	"logIndex": "0x2",
	"removed": false,
	"topics": [
		"0x555c5816cc24ae6b4a85b2e02a07ebc514a04639a07694f29ff9a0de9b650987",
		"0x0000000000000000000000000000000000000000000000000000000000079b03"
	],
	"transactionHash": "0x82cec4ef154ddd92f000e442db6a8710bec69c24d8d790c2398c2676e0d30704",
	"transactionIndex": "0x1"
}`)
	var l ethTypes.Log
	assert.Nilf(t, json.NewDecoder(s).Decode(&l), "failed to decode log")
	wasRun := false
	handleLogCallback(seawaterAddr, EmptyAddr, EmptyAddr, l, func(table string, a any) error {
		assert.Equalf(t, "events_seawater_updatepositionliquidity", table, "table not equal")
		updatePositionLiq, ok := a.(*seawater.UpdatePositionLiquidity)
		assert.Truef(t, ok, "UpdatePositionLiquidity type coercion not true")
		assert.Equalf(t,
			498435,
			updatePositionLiq.PosId,
			"position id not equal",
		)
		assert.Equalf(t,
			types.EmptyUnscaledNumber(),
			updatePositionLiq.Token0,
			"token not equal",
		)
		assert.Equalf(t,
			types.EmptyUnscaledNumber(),
			updatePositionLiq.Token1,
			"token not equal",
		)
		wasRun = true
		return nil
	})
	assert.True(t, wasRun)
}

func TestHandleLogCallbackMintPosition(t *testing.T) {
	seawaterAddr := ethCommon.HexToAddress("0x40e659f4eB2fdA398ce0860aFB74701d4977E530")
	s := strings.NewReader(`
{
	"address": "0x40e659f4eb2fda398ce0860afb74701d4977e530",
	"blockHash": "0x79fd90d0e9893ecf19863fe5efa73c46d4901fcd4047666f12c7cbdf70689b6f",
	"blockNumber": "0x32",
	"data": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d89e8",
	"logIndex": "0x0",
	"removed": false,
	"topics": [
		"0x7b0f5059c07211d90c2400fc99ac93e0e56db5168afa91f60d178bb6dc1c73f0",
		"0x0000000000000000000000000000000000000000000000000000000000000000",
		"0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5",
		"0x000000000000000000000000e984f758f362d255bd96601929970cef9ff19dd7"
	],
	"transactionHash": "0x20757f5e66e75ba065a02ce052fcd2fa7d51f0ce71487da172cc6b37c286fd75",
	"transactionIndex": "0x1"
}`)
	var l ethTypes.Log
	assert.Nilf(t, json.NewDecoder(s).Decode(&l), "failed to decode log")
	wasRun := false
	handleLogCallback(seawaterAddr, EmptyAddr, EmptyAddr, l, func(table string, a any) error {
		assert.Equalf(t, "events_seawater_mintposition", table, "table not equal")
		newPool, ok := a.(*seawater.MintPosition)
		assert.Truef(t, ok, "MintPosition type coercion not true")
		assert.Equalf(t,
			types.AddressFromString("0xFEb6034FC7dF27dF18a3a6baD5Fb94C0D3dCb6d5"),
			newPool.Owner,
			"token not equal",
		)
		wasRun = true
		return nil
	})
	assert.True(t, wasRun)
}

func TestHandleLogCallbackSwap1(t *testing.T) {
	seawaterAddr := ethCommon.HexToAddress("0x40e659f4eB2fdA398ce0860aFB74701d4977E530")
	s := strings.NewReader(`
{
	"address": "0x40e659f4eb2fda398ce0860afb74701d4977e530",
	"blockHash": "0x987589d1bde38473777e13752f9dd7acb089d3f2abcdec742c985d80a49cce53",
	"blockNumber": "0x44",
	"data": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000a9fe",
	"logIndex": "0x2",
	"removed": false,
	"topics": [
		"0x01bacdc82c3891bc884396788e83d024aafbd4e2a08341fb9c9ce422a683830f",
		"0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5",
		"0x000000000000000000000000e984f758f362d255bd96601929970cef9ff19dd7"
	],
	"transactionHash": "0x36f66e773dbf54c16e65ca12d2c0e4eeb37a66269332d6215f614e686c5b42a7",
	"transactionIndex": "0x1"
}`)
	var l ethTypes.Log
	assert.Nilf(t, json.NewDecoder(s).Decode(&l), "failed to decode log")
	wasRun := false
	handleLogCallback(seawaterAddr, EmptyAddr, EmptyAddr, l, func(table string, a any) error {
		assert.Equalf(t, "events_seawater_swap1", table, "table not equal")
		// This test is captured in a unit test, so we can focus on just testing
		// this one field.
		swap1, ok := a.(*seawater.Swap1)
		assert.Truef(t, ok, "Swap1 type coercion not true")
		assert.Equalf(t,
			types.AddressFromString("0xFEb6034FC7dF27dF18a3a6baD5Fb94C0D3dCb6d5"),
			swap1.User,
			"token not equal",
		)
		wasRun = true
		return nil
	})
	assert.True(t, wasRun)
}

func TestHandleLogCallbackSwap2(t *testing.T) {
	seawaterAddr := ethCommon.HexToAddress("0xE13Fec14aBFbAa5b185cFb46670A56BF072E13b1")
	s := strings.NewReader(`
{
	"address": "0xe13fec14abfbaa5b185cfb46670a56bf072e13b1",
	"blockHash": "0xfa2557048aba87af6b0ae1a3ddd87b665cf03b208544c4b57f9cd30c06482f39",
	"blockNumber": "0x760c3d",
	"data": "0x00000000000000000000000000000000000000000000000ad78ebc5ac6200000000000000000000000000000000000000000000000000000000000001009539600000000000000000000000000000000000000000000000000000002f06f4a04fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc6a9d0000000000000000000000000000000000000000000000000000000000009656",
	"logIndex": "0x2",
	"removed": false,
	"topics": [
		"0xd3593b1fa4a2b80431faf29b3fb80cd1ef82a2b65128a650c625c4ed8d1b4d92",
		"0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5",
		"0x00000000000000000000000022b9fa698b68bba071b513959794e9a47d19214c",
		"0x0000000000000000000000006437fdc89ced41941b97a9f1f8992d88718c81c5"
	],
	"transactionHash": "0x5fedbc94388f657cbb527989af55f596665d06d68f71643c4fe41a83cfdbe643",
	"transactionIndex": "0x1"
}`)
	var l ethTypes.Log
	assert.Nilf(t, json.NewDecoder(s).Decode(&l), "failed to decode log")
	wasRun := false
	err := handleLogCallback(seawaterAddr, EmptyAddr, EmptyAddr, l, func(table string, a any) error {
		assert.Equalf(t, "events_seawater_swap2", table, "table not equal")
		_, ok := a.(*seawater.Swap2)
		assert.Truef(t, ok, "Swap2 type coercion not true")
		wasRun = true
		return nil
	})
	assert.Nil(t, err)
	assert.True(t, wasRun)
}

func TestHandleLogCallbackAccountCreated(t *testing.T) {
	thirdwebAddr := ethCommon.HexToAddress("0x85e23b94e7F5E9cC1fF78BCe78cfb15B81f0DF00")
	s := strings.NewReader(`
{
	"address": "0x85e23b94e7f5e9cc1ff78bce78cfb15b81f0df00",
	"blockHash": "0xd6a09be6b519ca1495769a13e600573bdfb828893b18778bc982b5a59077fb51",
	"blockNumber": "0x728175",
	"data": "0x",
	"logIndex": "0x3",
	"removed": false,
	"topics": [
		"0xac631f3001b55ea1509cf3d7e74898f85392a61a76e8149181ae1259622dabc8",
		"0x000000000000000000000000c84b8d602a9566a20a5e9b46896a5f81587d9c65",
		"0x000000000000000000000000838ea3cf94d18c535fe653238b3a53c4a8c10e19"
	],
	"transactionHash": "0x4b1cedd2ac6032e9ceb3eea070ab87a8103054562b085dada6d33db3a6627485",
	"transactionIndex": "0x1"
}`)
	var l ethTypes.Log
	wasRun := false
	assert.Nilf(t, json.NewDecoder(s).Decode(&l), "failed to decode log")
	handleLogCallback(EmptyAddr, thirdwebAddr, EmptyAddr, l, func(table string, a any) error {
		assert.Equalf(t, "events_thirdweb_accountcreated", table, "table not equal")
		accountCreated, ok := a.(*thirdweb.AccountCreated)
		assert.Truef(t, ok, "AccountCreated type coercion not true")
		assert.Equalf(t,
			types.AddressFromString("0xc84b8d602a9566a20a5e9b46896a5f81587d9c65"),
			accountCreated.Account,
			"account not equal",
		)
		assert.Equalf(t,
			types.AddressFromString("0x838ea3cf94d18c535fe653238b3a53c4a8c10e19"),
			accountCreated.AccountAdmin,
			"account admin not equal",
		)
		wasRun = true
		return nil
	})
	assert.True(t, wasRun)
}

func TestCurrentEventIds(t *testing.T) {
	var currentIds = map[string]bool{ // From `forge selectors`, not including ERC20 Transfer
		"0x01bacdc82c3891bc884396788e83d024aafbd4e2a08341fb9c9ce422a683830f": false,
		"0x1b15f741d045342b3dab007e75a3d20b22aaab33e294b8fcce374753a4d9cea3": false,
		"0x4732a2a38bb86e2c4a36fcc0204c09ed254bcb6e36f7b76c0f0532a403d4b402": false,
		"0x555c5816cc24ae6b4a85b2e02a07ebc514a04639a07694f29ff9a0de9b650987": false,
		"0x7b0f5059c07211d90c2400fc99ac93e0e56db5168afa91f60d178bb6dc1c73f0": false,
		"0x95f3c86e9f05acaefa0a1c98f3eaa48aeb910a1dfa82ad7653a561eab31274cc": false,
		"0xcb076a66f4dca163de39a4023de987ca633a005767c796b3772e3462c573e339": false,
		"0xd3593b1fa4a2b80431faf29b3fb80cd1ef82a2b65128a650c625c4ed8d1b4d92": false,
		"0xd500e81443925d03f2ac45364aa32d71b4bbd8f697bc7b8fc5a4accc4601b54b": false,
		"0xac631f3001b55ea1509cf3d7e74898f85392a61a76e8149181ae1259622dabc8": false,
	}
	for _, id := range FilterTopics[0] {
		currentIds[id.Hex()] = true
	}
	for id, status := range currentIds {
		assert.Truef(t, status, "id %v is not tracked", id)
	}
}
