-- migrate:up

CREATE TABLE seawater_latest_ticks_2 (
	final_tick BIGINT NOT NULL,
	created_by TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	pool ADDRESS NOT NULL
);

CREATE FUNCTION snapshot_latest_ticks_1()
RETURNS VOID LANGUAGE PLPGSQL
AS $$
BEGIN
	DELETE FROM seawater_latest_ticks_2;
	INSERT INTO seawater_latest_ticks_2 SELECT * FROM seawater_latest_ticks_1;
END $$;

-- migrate:down
