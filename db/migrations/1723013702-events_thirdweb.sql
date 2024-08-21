-- migrate:up

CREATE TABLE events_thirdweb_accountcreated (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	block_number INTEGER NOT NULL,
	emitter_addr ADDRESS NOT NULL,

	account ADDRESS NOT NULL,
	account_admin ADDRESS NOT NULL
);

-- migrate:down
