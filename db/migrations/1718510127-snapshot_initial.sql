-- migrate:up

CREATE TABLE snapshot_positions_latest_1 (
	id SERIAL PRIMARY KEY,
	updated_by TIMESTAMP WITHOUT TIME ZONE NOT NULL,

	-- Taken from a left join.
	pos_id HUGEINT NOT NULL,
	owner ADDRESS NOT NULL,
	pool ADDRESS NOT NULL,
	lower BIGINT NOT NULL,
	upper BIGINT NOT NULL,

	-- Inserted from the lookup.
	amount0 HUGEINT NOT NULL,
	amount1 HUGEINT NOT NULL
);

CREATE TABLE snapshot_positions_log_1 (
	id SERIAL PRIMARY KEY,
	created_by TIMESTAMP WITHOUT TIME ZONE NOT NULL,

	-- Taken from a left join.
	pos_id HUGEINT NOT NULL,
	owner ADDRESS NOT NULL,
	pool ADDRESS NOT NULL,
	lower BIGINT NOT NULL,
	upper BIGINT NOT NULL,

	-- Inserted from the lookup.
	amount0 HUGEINT NOT NULL,
	amount1 HUGEINT NOT NULL
);

CREATE FUNCTION snapshot_create_positions_1(pools VARCHAR[], ids HUGEINT[], amount0s HUGEINT[], amount1s HUGEINT[])
RETURNS VOID LANGUAGE PLPGSQL
AS $$
DECLARE affected_rows INT;
BEGIN
	DELETE FROM snapshot_positions_latest_1;
	FOR i IN 1..array_length(ids, 1) LOOP
		INSERT INTO snapshot_positions_latest_1 (
			updated_by,
			pos_id,
			owner,
			pool,
			lower,
			upper,
			amount0,
			amount1
		)
		SELECT
			CURRENT_TIMESTAMP,
			sw.pos_id,
			sw.owner,
			pool,
			sw.lower,
			sw.upper,
			amount0s[i],
			amount1s[i]
		FROM
			events_seawater_mintPosition sw
		WHERE
			sw.pos_id = ids[i] AND
			sw.pool = pools[i];

		INSERT INTO snapshot_positions_log_1 (
			created_by,
			pos_id,
			owner,
			pool,
			lower,
			upper,
			amount0,
			amount1
		)
		SELECT
			CURRENT_TIMESTAMP,
			sw.pos_id,
			sw.owner,
			pool,
			sw.lower,
			sw.upper,
			amount0s[i],
			amount1s[i]
		FROM
			events_seawater_mintPosition sw
		WHERE
			sw.pos_id = ids[i] AND
			sw.pool = pools[i];
	END LOOP;
END $$;

CREATE VIEW seawater_final_ticks_decimals_1 AS
	WITH latest_swaps AS (
		SELECT
			final_tick,
			created_by,
			pool,
			ROW_NUMBER() OVER (PARTITION BY pool ORDER BY created_by DESC) AS rn
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
	)
	SELECT
		ls.final_tick,
		ls.created_by,
		ls.pool,
		ep.decimals
	FROM latest_swaps ls
	LEFT JOIN events_seawater_newPool ep ON ls.pool = ep.token
	WHERE ls.rn = 1
	ORDER BY ls.created_by DESC;

-- migrate:down
