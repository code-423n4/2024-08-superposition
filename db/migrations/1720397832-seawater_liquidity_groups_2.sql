-- migrate:up

-- Copy the state from the existing liquidity groups view to a new table on demand.

CREATE TABLE seawater_liquidity_groups_2 (
	pool ADDRESS NOT NULL,
	decimals HUGEINT NOT NULL,
	tick INTEGER NOT NULL,
	next_tick INTEGER NOT NULL,
	cumulative_amount0 NUMERIC NOT NULL,
	cumulative_amount1 NUMERIC NOT NULL
);

CREATE FUNCTION snapshot_liquidity_groups_1()
RETURNS VOID LANGUAGE PLPGSQL
AS $$
BEGIN
	DELETE FROM seawater_liquidity_groups_2;
	INSERT INTO seawater_liquidity_groups_2 SELECT * FROM seawater_liquidity_groups_1;
END $$;

-- migrate:down
