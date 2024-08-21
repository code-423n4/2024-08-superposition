-- migrate:up

-- ingestor_checkpointing_1 is used to keep a reference point for the last block the
-- ingestor is set at if it's in polling mode.

CREATE TABLE ingestor_checkpointing_1 (
	id SERIAL PRIMARY KEY,
	last_updated TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	block_number INTEGER NOT NULL
);

-- migrate:down
