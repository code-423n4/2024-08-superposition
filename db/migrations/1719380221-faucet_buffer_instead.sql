-- migrate:up

ALTER TABLE faucet_requests
	ADD COLUMN was_sent BOOLEAN NOT NULL DEFAULT FALSE,
	ADD COLUMN is_fly_staker BOOLEAN NOT NULL DEFAULT FALSE;

-- migrate:down
