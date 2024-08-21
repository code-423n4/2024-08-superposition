package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/big"
	"time"

	"github.com/fluidity-money/long.so/lib/config"
	"github.com/fluidity-money/long.so/lib/events/thirdweb"
	"github.com/fluidity-money/long.so/lib/features"
	"github.com/fluidity-money/long.so/lib/heartbeat"
	"github.com/fluidity-money/long.so/lib/setup"
	"github.com/fluidity-money/long.so/lib/types"

	"github.com/fluidity-money/long.so/lib/events/erc20"
	"github.com/fluidity-money/long.so/lib/events/leo"
	"github.com/fluidity-money/long.so/lib/events/seawater"

	"gorm.io/gorm"

	"github.com/ethereum/go-ethereum"
	ethCommon "github.com/ethereum/go-ethereum/common"
	ethTypes "github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

// FilterTopics to filter for using the Websocket/HTTP collection of logs.
var FilterTopics = [][]ethCommon.Hash{{ // Matches any of these in the first topic position.
	erc20.TopicTransfer,
	thirdweb.TopicAccountCreated,
	leo.TopicCampaignBalanceUpdated,
	leo.TopicCampaignCreated,
	leo.TopicCampaignUpdated,
	seawater.TopicMintPosition,
	seawater.TopicBurnPosition,
	seawater.TopicTransferPosition,
	seawater.TopicUpdatePositionLiquidity,
	seawater.TopicCollectFees,
	seawater.TopicNewPool,
	seawater.TopicCollectProtocolFees,
	seawater.TopicSwap2,
	seawater.TopicSwap1,
}}

// Entry function, using the database to determine if polling should be
// used exclusively to receive logs, polling only for catchup, or
// exclusively websockets.
func Entry(f features.F, config config.C, thirdwebFactoryAddr, leoAddr types.Address, ingestorPagination int, pollWait int, c *ethclient.Client, db *gorm.DB) {
	var (
		seawaterAddr = ethCommon.HexToAddress(config.SeawaterAddr.String())
		thirdwebAddr = ethCommon.HexToAddress(thirdwebFactoryAddr.String())
		leoAddr_ =ethCommon.HexToAddress(leoAddr.String())
	)
	IngestPolling(f, c, db, ingestorPagination, pollWait, seawaterAddr, thirdwebAddr, leoAddr_)
}

// IngestPolling by repeatedly polling the Geth RPC for changes to
// receive log updates. Checks the database first to determine where the
// last point is before continuing. Assumes ethclient is HTTP.
// Uses the IngestBlockRange function to do all the lifting.
func IngestPolling(f features.F, c *ethclient.Client, db *gorm.DB, ingestorPagination, ingestorPollWait int, seawaterAddr, thirdwebAddr, leoAddr ethCommon.Address) {
	if ingestorPagination <= 0 {
		panic("bad ingestor pagination")
	}
	for {
		// Start by finding the latest block number.
		from, err := getLastBlockCheckpointed(db)
		if err != nil {
			setup.Exitf("failed to get the last block checkpoint: %v", err)
		}
		to := from + uint64(ingestorPagination)
		from++ // Increase the starting block by 1 so we always get the next block.
		slog.Info("latest block checkpoint",
			"from", from,
			"collecting until", to,
		)
		IngestBlockRange(f, c, db, seawaterAddr, thirdwebAddr, leoAddr, from, to)
		slog.Info("about to sleep before polling again",
			"poll seconds", ingestorPollWait,
		)
		heartbeat.Pulse() // Report that we're alive.
		time.Sleep(time.Duration(ingestorPollWait) * time.Second)
	}
}

// IngestBlockRange using the Geth RPC provided, using the handleLog
// funciton to write records found to the database. Assumes the ethclient
// provided is a HTTP client. Also updates the underlying last block it
// saw into the database checkpoints. Fatals if something goes wrong.
func IngestBlockRange(f features.F, c *ethclient.Client, db *gorm.DB, seawaterAddr, thirdwebAddr, leoAddr ethCommon.Address, from, to uint64) {
	logs, err := c.FilterLogs(context.Background(), ethereum.FilterQuery{
		FromBlock: new(big.Int).SetUint64(from),
		ToBlock:   new(big.Int).SetUint64(to),
		Topics:    FilterTopics,
	})
	if err != nil {
		setup.Exitf("failed to filter logs: %v", err)
	}
	err = db.Transaction(func(db *gorm.DB) error {
		wasChanged := false
		biggestBlockNo := from
		for _, l := range logs {
			if err := handleLog(db, seawaterAddr, thirdwebAddr, leoAddr, l); err != nil {
				return fmt.Errorf("failed to unpack log: %v", err)
			}
			isBiggerOrEqual := biggestBlockNo <= l.BlockNumber
			if isBiggerOrEqual {
				biggestBlockNo = l.BlockNumber
				wasChanged = true
			}
		}
		// Update checkpoint here.
		if wasChanged {
			if err := updateCheckpoint(db, biggestBlockNo); err != nil {
				return fmt.Errorf("failed to update a checkpoint: %v", err)
			}
		}
		return nil
	})
	if err != nil {
		setup.Exitf("failed to ingest logs into db: %v", err)
	}
}

func handleLog(db *gorm.DB, seawaterAddr, thirdwebAddr, leoAddr ethCommon.Address, l ethTypes.Log) error {
	return handleLogCallback(seawaterAddr, thirdwebAddr, leoAddr, l, func(t string, a any) error {
		// Use the database connection as the callback to insert this log.
		return databaseInsertLog(db, t, a)
	})
}
func handleLogCallback(seawaterAddr, thirdwebAddr, leoAddr ethCommon.Address, l ethTypes.Log, cb func(table string, l any) error) error {
	var topic1, topic2, topic3 ethCommon.Hash
	topic0 := l.Topics[0]
	if len(l.Topics) > 1 {
		topic1 = l.Topics[1]
	}
	if len(l.Topics) > 2 {
		topic2 = l.Topics[2]
	}
	if len(l.Topics) > 3 {
		topic3 = l.Topics[3]
	}
	data := l.Data
	var (
		a     any // Log that we're unpacking.
		err   error
		table string // Table name to insert the log into
	)
	var (
		blockHash       = l.BlockHash.String()
		transactionHash = l.TxHash.String()
		blockNumber     = l.BlockNumber
		emitterAddr     = l.Address
	)
	slog.Debug("unpacking event",
		"block hash", blockHash,
		"transaction hash", transactionHash,
		"block number", blockNumber,
		"emitter addr", emitterAddr,
		"topic0", topic0,
		"topic1", topic1,
		"topic2", topic2,
		"topic3", topic3,
	)
	logEvent := func(n string) {
		slog.Debug("event identified! unpacked",
			"event name", n,
			"block hash", blockHash,
			"transaction hash", transactionHash,
			"block number", blockNumber,
			"emitter addr", emitterAddr,
			"topic0", topic0,
			"topic1", topic1,
			"topic2", topic2,
			"topic3", topic3,
		)
	}
	// If the event was made by Seawater or Thirdweb. Assumed to be the case, so
	// non-Seawater events should set this to false in this switch. Used to
	// check the event emitter.
	isSeawater := true // This should be invalidated by other contracts!
	var isThirdweb, isLeo bool
	switch topic0 {
	case erc20.TopicTransfer:
		a, err = erc20.UnpackTransfer(topic1, topic2, data)
		table = "events_erc20_transfer"
		logEvent("Transfer")
		isSeawater = false

	case thirdweb.TopicAccountCreated:
		a, err = thirdweb.UnpackAccountCreated(topic1, topic2, data)
		logEvent("AccountCreated")
		table = "events_thirdweb_accountcreated"
		isSeawater = false
		isThirdweb = true

	case leo.TopicCampaignBalanceUpdated:
		a, err = leo.UnpackCampaignBalanceUpdated(topic1, topic2, topic3, data)
		logEvent("CampaignBalanceCreated")
		table = "events_leo_campaignbalancecreated"
		isSeawater = false
		isLeo = true

	case leo.TopicCampaignCreated:
		a, err = leo.UnpackCampaignCreated(topic1, topic2, topic3, data)
		logEvent("CampaignCreated")
		table = "events_leo_campaigncreated"
		isSeawater = false
		isLeo = true

	case leo.TopicCampaignUpdated:
		a, err = leo.UnpackCampaignUpdated(topic1, topic2, topic3, data)
		logEvent("CampaignUpdated")
		table = "events_leo_campaignupdated"
		isSeawater = false
		isLeo = true

	case seawater.TopicMintPosition:
		a, err = seawater.UnpackMintPosition(topic1, topic2, topic3, data)
		logEvent("MintPosition")
		table = "events_seawater_mintposition"

	case seawater.TopicBurnPosition:
		a, err = seawater.UnpackBurnPosition(topic1, topic2, data)
		logEvent("BurnPosition")
		table = "events_seawater_burnposition"

	case seawater.TopicTransferPosition:
		a, err = seawater.UnpackTransferPosition(topic1, topic2, topic3, data)
		logEvent("TransferPosition")
		table = "events_seawater_transferposition"

	case seawater.TopicUpdatePositionLiquidity:
		a, err = seawater.UnpackUpdatePositionLiquidity(topic1, topic2, data)
		logEvent("UpdatePositionLiquidity")
		table = "events_seawater_updatepositionliquidity"

	case seawater.TopicCollectFees:
		a, err = seawater.UnpackCollectFees(topic1, topic2, topic3, data)
		logEvent("CollectFees")
		table = "events_seawater_collectfees"

	case seawater.TopicNewPool:
		a, err = seawater.UnpackNewPool(topic1, topic2, topic3, data)
		logEvent("NewPool")
		table = "events_seawater_newpool"

	case seawater.TopicCollectProtocolFees:
		a, err = seawater.UnpackCollectProtocolFees(topic1, topic2, data)
		logEvent("CollectProtocolFees")
		table = "events_seawater_collectprotocolfees"

	case seawater.TopicSwap2:
		a, err = seawater.UnpackSwap2(topic1, topic2, topic3, data)
		logEvent("Swap2")
		table = "events_seawater_swap2"

	case seawater.TopicSwap1:
		a, err = seawater.UnpackSwap1(topic1, topic2, data)
		logEvent("Swap1")
		table = "events_seawater_swap1"

	default:
		return fmt.Errorf("unexpected topic: %v", topic0)
	}
	if err != nil {
		return fmt.Errorf("failed to process topic for table %#v: %v", table, err)
	}
	// Skip Thirdweb if the defacto contract didn't create the event.
	if isThirdweb && thirdwebAddr != emitterAddr {
		slog.Warn("ignoring a Thirdweb log from a sender that wasn't Leo",
			"seawater address", seawaterAddr,
			"thirdweb address", thirdwebAddr,
			"leo address", leoAddr,
			"emitter address", emitterAddr,
			"topic0", topic0,
			"transaction hash", transactionHash,
		)
		return nil
	}
	// Skip Leo if the defacto contract didn't create the event.
	if isLeo && leoAddr != emitterAddr {
		slog.Warn("ignoring a Leo log from a sender that wasn't Leo",
			"seawater address", seawaterAddr,
			"thirdweb address", thirdwebAddr,
			"leo address", leoAddr,
			"emitter address", emitterAddr,
			"topic0", topic0,
			"transaction hash", transactionHash,
		)
		return nil
	}
	if isSeawater {
		// Make sure that the log came from the Seawater contract.
		if seawaterAddr != emitterAddr {
			slog.Warn("ignoring a Seawater log from a sender that wasn't seawater",
				"seawater address", seawaterAddr,
				"emitter address", emitterAddr,
				"topic0", topic0,
				"transaction hash", transactionHash,
			)
			return nil
		}
	}
	setEventFields(&a, blockHash, transactionHash, blockNumber, emitterAddr.String())
	return cb(table, a)
}

func databaseInsertLog(db *gorm.DB, table string, a any) error {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(a); err != nil {
		return fmt.Errorf("encoding block header: %v", err)
	}
	if err := db.Table(table).Omit("CreatedBy").Create(a).Error; err != nil {
		return fmt.Errorf("inserting log: %v", err)
	}
	return nil
}
