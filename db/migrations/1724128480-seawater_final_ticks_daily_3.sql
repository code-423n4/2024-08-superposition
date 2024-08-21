-- migrate:up

CREATE TABLE seawater_final_ticks_daily_3 (
	final_tick BIGINT NOT NULL,
	pool ADDRESS NOT NULL,
	day TIMESTAMP WITHOUT TIME ZONE
);

CREATE FUNCTION snapshot_final_ticks_daily_3()
RETURNS VOID LANGUAGE PLPGSQL
AS $$
BEGIN
	DELETE FROM seawater_final_ticks_daily_3;
	INSERT INTO seawater_final_ticks_daily_3 SELECT * FROM seawater_final_ticks_daily_1;
END $$;

-- migrate:down
