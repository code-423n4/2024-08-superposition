
-- migrate:up

CREATE TABLE events_erc20_transfer (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	sender ADDRESS NOT NULL,
	recipient ADDRESS NOT NULL,
	value HUGEINT NOT NULL
);

-- migrate:down

-- whitespace change 6
