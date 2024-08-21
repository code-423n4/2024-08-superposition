-- migrate:up

CREATE TABLE snapshot_positions_latest_decimals_grouped_user_1_return (
	pool ADDRESS NOT NULL,
	decimals HUGEINT NOT NULL,
	cumulative_amount0 HUGEINT NOT NULL,
	cumulative_amount1 HUGEINT NOT NULL
);

CREATE FUNCTION snapshot_positions_latest_decimals_grouped_user_1(wallet ADDRESS)
RETURNS SETOF snapshot_positions_latest_decimals_grouped_user_1_return
LANGUAGE SQL
STABLE
AS
$$
SELECT
	pool,
	decimals,
	SUM(amount0) AS cumulative_amount0,
	SUM(amount1) AS cumulative_amount1
FROM
	snapshot_positions_latest_decimals_1
WHERE owner = wallet
GROUP BY
	pool,
	decimals;
$$;

-- migrate:down
