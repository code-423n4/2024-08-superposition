-- migrate:up

CREATE TABLE events_leo_campaignupdated (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	identifier VARCHAR NOT NULL,
	pool ADDRESS NOT NULL,
	per_second HUGEINT NOT NULL,
	tick_lower INTEGER NOT NULL,
	tick_upper INTEGER NOT NULL,
	starting TIMESTAMP WITHOUT TIME ZONE,
	ending TIMESTAMP WITHOUT TIME ZONE
);

-- migrate:down
