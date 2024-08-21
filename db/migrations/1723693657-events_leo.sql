-- migrate:up

CREATE TABLE events_leo_campaignbalanceupdated (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	identifier VARCHAR NOT NULL,
	new_maximum HUGEINT NOT NULL
);

CREATE TABLE events_leo_campaigncreated (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	identifier VARCHAR NOT NULL,
	pool ADDRESS NOT NULL,
	token ADDRESS NOT NULL,
	tick_lower INTEGER NOT NULL,
	tick_upper INTEGER NOT NULL,
	owner ADDRESS NOT NULL,
	starting TIMESTAMP WITHOUT TIME ZONE,
	ending TIMESTAMP WITHOUT TIME ZONE
);

CREATE UNIQUE INDEX ON events_leo_campaigncreated (identifier, pool);

-- migrate:down
