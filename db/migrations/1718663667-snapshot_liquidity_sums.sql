-- migrate:up

CREATE VIEW seawater_liquidity_groups_1 AS
	WITH tick_ranges AS (
		SELECT generate_series(-887272, 887272, 10000) AS tick
	),
	position_ticks AS (
		SELECT
			tr.tick,
			tr.tick + 10000 AS next_tick,
			spl.pos_id,
			spl.owner,
			spl.pool,
			spl.lower,
			spl.upper,
			spl.amount0,
			spl.amount1
		FROM
			tick_ranges tr
		LEFT JOIN
			snapshot_positions_latest_1 spl
		ON
			tr.tick <= spl.upper AND tr.tick + 10000 > spl.lower
	),
	cumulative_amounts AS (
		SELECT
			pool,
			tick,
			next_tick,
			SUM(amount0) AS cumulative_amount0,
			SUM(amount1) AS cumulative_amount1
		FROM
			position_ticks
		GROUP BY
			pool, tick, next_tick
	)
	SELECT
		pool,
		np.decimals,
		tick,
		next_tick,
		cumulative_amount0,
		cumulative_amount1
	FROM
		cumulative_amounts
	LEFT JOIN events_seawater_newPool np ON np.token = pool
	WHERE
		cumulative_amount0 > 0 OR cumulative_amount1 > 0
	ORDER BY
		tick;

-- migrate:down
