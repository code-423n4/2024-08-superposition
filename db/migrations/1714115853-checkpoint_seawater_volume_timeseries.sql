-- migrate:up

-- Price is always denominated in the form of the price of the current asset denominated
-- against fUSDC, which is always assumed to be 1 (ie, currently the price of Ethereum is
-- 3,143.52, so the price is 3,143.52.)

-- swap1_price_hourly_1 requires a single join, so it can be a continuous aggregate
CREATE MATERIALIZED VIEW seawater_pool_swap1_price_hourly_1 WITH (
	timescaledb.continuous,
	timescaledb.materialized_only = false
) AS
	SELECT
		time_bucket(INTERVAL '1 hour', events_seawater_swap1.created_by) AS hourly_interval,
		pool,
		1.0001 ^ (AVG(final_tick)) * 1000000 / (10 ^ events_seawater_newPool.decimals) AS price,
		events_seawater_newpool.decimals AS decimals
	FROM events_seawater_swap1
	-- assume that all swaps have a token that is referenced by a pool!
	JOIN events_seawater_newPool ON token = pool
	GROUP BY pool, hourly_interval, events_seawater_newpool.decimals
	WITH NO DATA;

SELECT add_continuous_aggregate_policy('seawater_pool_swap1_price_hourly_1',
  start_offset => NULL,
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- swap2_price_hourly_1 requires a UNION and LEFT JOIN, so it cannot be a continuous aggregate
CREATE MATERIALIZED VIEW seawater_pool_swap2_price_hourly_1 AS
	SELECT
		pool,
		date_trunc('hour', combined.created_by) AS hourly_interval,
		1.0001 ^ (AVG(final_tick)) * 1000000 / (10 ^ events_seawater_newPool.decimals) AS price,
		events_seawater_newpool.decimals AS decimals
	FROM (
		SELECT
			from_ AS pool,
			final_tick0 AS final_tick,
			created_by
		FROM
			events_seawater_swap2
		UNION ALL
		SELECT
			to_ AS pool,
			final_tick1 AS final_tick,
			created_by
		FROM
			events_seawater_swap2
	) AS combined
	LEFT JOIN events_seawater_newPool ON token = pool
	GROUP BY pool, hourly_interval, events_seawater_newpool.decimals;

CREATE MATERIALIZED VIEW seawater_swaps_average_price_hourly_1 AS
	SELECT pool, hourly_interval, SUM(price) AS price, decimals
	FROM (
		SELECT pool, hourly_interval, price, decimals
		FROM seawater_pool_swap1_price_hourly_1
		UNION ALL
		SELECT pool, hourly_interval, price, decimals
		FROM seawater_pool_swap2_price_hourly_1
	) AS combined
	GROUP BY pool, hourly_interval, decimals;

CREATE VIEW seawater_pool_swap1_volume_hourly_1 AS
	SELECT
		events_seawater_swap1.pool AS pool,
		date_trunc('hour', events_seawater_swap1.created_by) AS hourly_interval,
		CAST(SUM(amount1) AS HUGEINT) AS fusdc_volume,
		CAST(SUM(amount0) AS HUGEINT) AS tokena_volume
	FROM events_seawater_swap1
	GROUP BY
		events_seawater_swap1.pool,
		hourly_interval,
		events_seawater_swap1.created_by;

CREATE VIEW seawater_pool_swap2_volume_hourly_1 AS
	SELECT
		combined.pool as pool,
		date_trunc('hour', combined.created_by) AS hourly_interval,
		CAST(SUM(total_fluid_volume) AS HUGEINT) AS fusdc_volume,
		CAST(SUM(tokena_volume) AS HUGEINT) AS tokena_volume
	FROM (
		SELECT
			from_ AS pool,
			amount_in AS tokena_volume,
			fluid_volume AS total_fluid_volume,
			created_by
		FROM
			events_seawater_swap2
		UNION ALL
		SELECT
			to_ AS pool,
			amount_out AS tokena_volume,
			fluid_volume AS total_fluid_volume,
			created_by
		FROM
			events_seawater_swap2
	) AS combined
	GROUP BY combined.pool, hourly_interval;

CREATE MATERIALIZED VIEW seawater_pool_swap_volume_hourly_1 AS
	SELECT
		combined.pool,
		combined.hourly_interval AS hourly_interval,
		new_pool.decimals,
		CAST(SUM(fusdc_volume) AS HUGEINT) AS fusdc_volume_unscaled,
		-- TODO assumes 6 decimals for fUSDC
		SUM(fusdc_volume / (10 ^ 6)) AS fusdc_volume_scaled,
		SUM(tokena_volume) AS tokena_volume_unscaled,
		SUM(tokena_volume) / (10 ^ new_pool.decimals) AS tokena_volume_scaled,
		SUM(tokena_volume / (10 ^ new_pool.decimals) * checkpoint.price)
	FROM (
		SELECT pool, hourly_interval, fusdc_volume, tokena_volume
		FROM seawater_pool_swap2_volume_hourly_1
		UNION ALL
		SELECT pool, hourly_interval, fusdc_volume, tokena_volume
		FROM seawater_pool_swap1_volume_hourly_1
	) AS combined
	LEFT JOIN
		events_seawater_newPool AS new_pool
		ON new_pool.token = combined.pool
	LEFT JOIN
		seawater_swaps_average_price_hourly_1 AS checkpoint
		ON combined.hourly_interval = checkpoint.hourly_interval
	GROUP BY
		combined.pool,
		combined.hourly_interval,
		new_pool.decimals
	ORDER BY hourly_interval;

CREATE MATERIALIZED VIEW seawater_pool_swap_volume_daily_1 AS
SELECT
	FLOOR(EXTRACT(EPOCH FROM NOW())) AS timestamp,
	pool AS token1_token,
	SUM(fusdc_volume_unscaled) AS fusdc_value_unscaled,
	SUM(tokena_volume_unscaled) AS token1_value_unscaled,
	decimals AS token1_decimals,
	time_bucket('1 day', hourly_interval) AS interval_timestamp
FROM seawater_pool_swap_volume_hourly_1
GROUP BY interval_timestamp, token1_token, token1_decimals
ORDER BY interval_timestamp DESC;

CREATE MATERIALIZED VIEW seawater_pool_swap_volume_monthly_1 AS
SELECT
	FLOOR(EXTRACT(EPOCH FROM NOW())) AS timestamp,
	pool AS token1_token,
	SUM(fusdc_volume_unscaled) AS fusdc_value_unscaled,
	SUM(tokena_volume_unscaled) AS token1_value_unscaled,
	decimals AS token1_decimals,
	time_bucket('1 month', hourly_interval) AS interval_timestamp
FROM seawater_pool_swap_volume_hourly_1
GROUP BY interval_timestamp, token1_token, token1_decimals
ORDER BY interval_timestamp DESC;

-- This would make use of triggers to keep the materialized views up to date, but Postgres doesn't support triggers on materialized views. Instead, schedule regular updates with pg_cron
CREATE FUNCTION refresh_swap_price_volume_views()
RETURNS VOID LANGUAGE PLPGSQL
AS $$
BEGIN
	REFRESH MATERIALIZED VIEW seawater_pool_swap2_price_hourly_1;
	REFRESH MATERIALIZED VIEW seawater_swaps_average_price_hourly_1;
	REFRESH MATERIALIZED VIEW seawater_pool_swap_volume_hourly_1;
	REFRESH MATERIALIZED VIEW seawater_pool_swap_volume_daily_1;
	REFRESH MATERIALIZED VIEW seawater_pool_swap_volume_monthly_1;
END $$;

SELECT cron.schedule('refresh-swap-price-volume', '*/30 * * * *', $$SELECT refresh_swap_price_volume_views()$$);

-- migrate:down
