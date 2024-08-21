-- migrate:up

CREATE TABLE seawater_final_ticks_monthly_3 (
	final_tick BIGINT NOT NULL,
	pool ADDRESS NOT NULL,
	month TIMESTAMP WITHOUT TIME ZONE
);

CREATE FUNCTION snapshot_final_ticks_monthly_3()
RETURNS VOID LANGUAGE PLPGSQL
AS $$
BEGIN
	DELETE FROM seawater_final_ticks_monthly_3;
	INSERT INTO seawater_final_ticks_monthly_3 SELECT * FROM seawater_final_ticks_monthly_1;
END $$;

-- migrate:down
