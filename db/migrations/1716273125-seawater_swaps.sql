-- migrate:up

CREATE TABLE seawater_swaps_1_return(
	id INTEGER NOT NULL,
	timestamp HUGEINT NOT NULL,
	sender VARCHAR NOT NULL,
	token_in VARCHAR NOT NULL,
	token_out VARCHAR NOT NULL,
	amount_in HUGEINT NOT NULL,
	amount_out HUGEINT NOT NULL,
	token_out_decimals HUGEINT NOT NULL,
	token_in_decimals HUGEINT NOT NULL
);

-- TODO ideally this should be a (materialized) view, which would require constant lookup of fUSDC address/decimals
CREATE FUNCTION seawater_swaps_1(fusdcAddress ADDRESS, fusdcDecimals HUGEINT)
RETURNS SETOF seawater_swaps_1_return
LANGUAGE SQL
STABLE
AS
$$
SELECT
		swaps.id,
		swaps.timestamp,
		swaps.sender,
		swaps.token_in,
		swaps.token_out,
		swaps.amount_in,
		swaps.amount_out,
	COALESCE(toPool.decimals, fusdcDecimals) AS token_out_decimals,
	COALESCE(fromPool.decimals, fusdcDecimals) AS token_in_decimals
FROM (
	SELECT
		id,
		FLOOR(EXTRACT(EPOCH FROM created_by)) AS timestamp,
		user_ AS sender,
		from_ AS token_in,
		to_ AS token_out,
		amount_in,
		amount_out
	FROM
		events_seawater_swap2
	UNION ALL
	SELECT
		id,
		FLOOR(EXTRACT(EPOCH FROM created_by)) AS timestamp,
		user_,
		CASE
			WHEN zero_for_one THEN pool
			ELSE fusdcAddress
		END AS from,
		CASE
			WHEN zero_for_one THEN fusdcAddress
			ELSE pool
		END AS to,
		CASE
			WHEN zero_for_one THEN amount0
			ELSE amount1
		END AS amount_in,
		CASE
			WHEN zero_for_one THEN amount1
			ELSE amount0
		END AS amount_out
	FROM
		events_seawater_swap1
) swaps
LEFT JOIN events_seawater_newpool fromPool
	ON swaps.token_in = fromPool.token
LEFT JOIN events_seawater_newpool toPool
	ON swaps.token_out = toPool.token;
$$;

-- Retrieve the most recent ticks in each pool for swap1, swap2 from, and swap2 to. Intended to be filtered like
-- WHERE pool = ? LIMIT 1 to find the most recent tick
CREATE VIEW seawater_final_ticks_1 AS
SELECT *
FROM (
	SELECT final_tick, created_by, pool
	FROM events_seawater_swap1
	UNION ALL
	SELECT final_tick0 AS final_tick, created_by, from_ AS pool
	FROM events_seawater_swap2
	UNION ALL
	SELECT final_tick1 AS final_tick, created_by, to_ AS pool
	FROM events_seawater_swap2
) AS swaps
ORDER BY created_by DESC;

CREATE VIEW seawater_final_ticks_daily_1 AS
SELECT
	-- TODO it may make sense to average this over the day.
	LAST(final_tick, created_by) AS final_tick,
	pool,
	time_bucket('1 day', created_by) AS day
FROM
	seawater_final_ticks_1
GROUP BY
	pool,
	day
ORDER BY
	day DESC;

CREATE VIEW seawater_final_ticks_monthly_1 AS
SELECT
	-- TODO it may make sense to average this over the month.
	LAST(final_tick, created_by) AS final_tick,
	pool,
	time_bucket('1 month', created_by) AS month
FROM
	seawater_final_ticks_1
GROUP BY
	pool,
	month
ORDER BY
	month DESC;

-- migrate:down
