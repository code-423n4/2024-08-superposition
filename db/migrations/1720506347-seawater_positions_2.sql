-- migrate:up

CREATE TABLE seawater_active_positions_2 (
	created_by TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	block_hash HASH NOT NULL,
	transaction_hash HASH NOT NULL,
	created_block_number INTEGER NOT NULL,
	pos_id HUGEINT NOT NULL,
	owner ADDRESS NOT NULL,
	pool ADDRESS NOT NULL,
	lower BIGINT NOT NULL,
	upper BIGINT NOT NULL
);

CREATE FUNCTION snapshot_seawater_active_positions()
RETURNS VOID LANGUAGE PLPGSQL
AS $$
BEGIN
	DELETE FROM seawater_active_positions_2;
	INSERT INTO seawater_active_positions_2 SELECT * FROM seawater_active_positions_1;
END $$;

SELECT cron.schedule('update seawater positions', '*/1 * * * *', 'SELECT snapshot_seawater_active_positions();');

-- migrate:down
