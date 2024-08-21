-- migrate:up

CREATE VIEW seawater_latest_ticks_1 AS
SELECT final_tick, created_by, pool
FROM (
	SELECT final_tick, created_by, pool
	FROM (
		SELECT final_tick, created_by, pool,
			   ROW_NUMBER() OVER (PARTITION BY pool ORDER BY created_by DESC) AS rn
		FROM events_seawater_swap1
	) AS subquery1
	WHERE rn = 1
	UNION ALL
	SELECT final_tick0 AS final_tick, created_by, from_ AS pool
	FROM (
		SELECT final_tick0, created_by, from_,
			   ROW_NUMBER() OVER (PARTITION BY from_ ORDER BY created_by DESC) AS rn
		FROM events_seawater_swap2
	) AS subquery2
	WHERE rn = 1
	UNION ALL
	SELECT final_tick1 AS final_tick, created_by, to_ AS pool
	FROM (
		SELECT final_tick1, created_by, to_,
			   ROW_NUMBER() OVER (PARTITION BY to_ ORDER BY created_by DESC) AS rn
		FROM events_seawater_swap2
	) AS subquery3
	WHERE rn = 1
) AS swaps
ORDER BY created_by DESC;

-- migrate:down
