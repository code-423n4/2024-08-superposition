-- migrate:up

CREATE VIEW snapshot_positions_latest_decimals_1 AS
	SELECT
		snapshot_positions_latest_1.id AS id,
		updated_by,
		pos_id,
		owner,
		pool,
		lower,
		upper,
		amount0,
		amount1,
		pool.decimals AS decimals
	FROM
		snapshot_positions_latest_1
	LEFT JOIN events_seawater_newPool pool ON token = pool;

CREATE VIEW snapshot_positions_latest_decimals_grouped_1 AS
	SELECT
		pool,
		decimals,
		SUM(amount0) AS cumulative_amount0,
		SUM(amount1) AS cumulative_amount1
	FROM
		snapshot_positions_latest_decimals_1
	GROUP BY
		pool,
		decimals;

-- migrate:down
