
-- migrate:up

CREATE EXTENSION pg_cron;

CREATE DOMAIN HUGEINT NUMERIC(78, 0);

CREATE DOMAIN ADDRESS CHAR(42);

CREATE DOMAIN HASH CHAR(66);

CREATE TABLE events_seawater_burnPosition (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	-- id
	pos_id HUGEINT NOT NULL,
	owner ADDRESS NOT NULL
);

CREATE UNIQUE INDEX ON events_seawater_burnPosition (pos_id);
CREATE UNIQUE INDEX ON events_seawater_burnPosition (owner);

CREATE TABLE events_seawater_mintPosition (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	-- id
	pos_id HUGEINT NOT NULL,
	owner ADDRESS NOT NULL,
	pool ADDRESS NOT NULL,
	lower BIGINT NOT NULL,
	upper BIGINT NOT NULL
);

CREATE UNIQUE INDEX ON events_seawater_mintPosition (pos_id);
CREATE INDEX ON events_seawater_mintPosition (owner, pool);

CREATE TABLE events_seawater_transferPosition (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	from_ ADDRESS NOT NULL,
	to_ ADDRESS NOT NULL,
	-- id
	pos_id HUGEINT NOT NULL
);

CREATE INDEX ON events_seawater_transferPosition (pos_id);
CREATE INDEX ON events_seawater_transferPosition (from_);
CREATE INDEX ON events_seawater_transferPosition (to_);

CREATE TABLE events_seawater_updatePositionLiquidity (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	-- id
	pos_id HUGEINT NOT NULL,
	token0 HUGEINT NOT NULL,
	token1 HUGEINT NOT NULL
);

CREATE INDEX ON events_seawater_updatePositionLiquidity (pos_id);

CREATE TABLE events_seawater_collectFees (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	-- id
	pos_id HUGEINT NOT NULL,
	pool ADDRESS NOT NULL,
	to_ ADDRESS NOT NULL,
	amount0 HUGEINT NOT NULL,
	amount1 HUGEINT NOT NULL
);

CREATE INDEX ON events_seawater_collectFees (pos_id);
CREATE INDEX ON events_seawater_collectFees (pool, to_);

CREATE TABLE events_seawater_newPool (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	token ADDRESS NOT NULL,
	fee INTEGER NOT NULL,
	decimals HUGEINT NOT NULL,
	tick_spacing INTEGER NOT NULL
);

CREATE UNIQUE INDEX ON events_seawater_newPool (token);

CREATE TABLE events_seawater_collectProtocolFees (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	pool ADDRESS NOT NULL,
	to_ ADDRESS NOT NULL,
	amount0 HUGEINT NOT NULL,
	amount1 HUGEINT NOT NULL
);

CREATE INDEX ON events_seawater_collectProtocolFees (pool);
CREATE INDEX ON events_seawater_collectProtocolFees (pool, to_);
CREATE INDEX ON events_seawater_collectProtocolFees (to_);

CREATE TABLE events_seawater_swap2 (
	id SERIAL,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	user_ ADDRESS NOT NULL,
	from_ ADDRESS NOT NULL,
	to_ ADDRESS NOT NULL,
	amount_in HUGEINT NOT NULL,
	amount_out HUGEINT NOT NULL,
	fluid_volume HUGEINT NOT NULL,
	final_tick0 BIGINT NOT NULL,
	final_tick1 BIGINT NOT NULL,

	-- timescale requires that unique indexes include the partition key (created_by)
	PRIMARY KEY (id, created_by)
);

CREATE INDEX ON events_seawater_swap2 (user_);
CREATE INDEX ON events_seawater_swap2 (user_, from_);
CREATE INDEX ON events_seawater_swap2 (user_, to_);

SELECT create_hypertable('events_seawater_swap2', by_range('created_by'));

CREATE TABLE events_seawater_swap1 (
	id SERIAL,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	user_ ADDRESS NOT NULL,
	pool ADDRESS NOT NULL,
	zero_for_one BOOLEAN NOT NULL,
	amount0 HUGEINT NOT NULL,
	amount1 HUGEINT NOT NULL,
	final_tick BIGINT NOT NULL,

	-- timescale requires that unique indexes include the partition key (created_by)
	PRIMARY KEY (id, created_by)
);

CREATE INDEX ON events_seawater_swap1 (user_);
CREATE INDEX ON events_seawater_swap1 (user_, pool);

SELECT create_hypertable('events_seawater_swap1', by_range('created_by'));

-- migrate:down
