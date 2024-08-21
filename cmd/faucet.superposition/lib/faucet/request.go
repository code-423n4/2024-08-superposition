package faucet

import "time"

type FaucetRequest struct {
	Addr                 string
	IpAddr               string
	CreatedBy, UpdatedBy time.Time
	WasSent, IsFlyStaker bool
}
