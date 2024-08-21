-- migrate:up

CREATE TABLE swaps_decimals_group_1_return (
	pool ADDRESS NOT NULL,
	decimals HUGEINT NOT NULL,
	cumulative_amount0 HUGEINT NOT NULL,
	cumulative_amount1 HUGEINT NOT NULL
);

CREATE FUNCTION swaps_decimals_user_group_1(
	fusdcAddress ADDRESS,
	fusdcDecimals HUGEINT,
	walletAddress ADDRESS
)
RETURNS SETOF swaps_decimals_group_1_return
LANGUAGE SQL
STABLE
AS
$$
WITH swap_data AS (
	SELECT *
	FROM seawater_swaps_1(fusdcAddress, fusdcDecimals)
	WHERE sender = walletAddress
)
SELECT
	CASE
		WHEN token_in != fusdcAddress THEN token_in
		ELSE token_out
	END AS pool,
	CASE
		WHEN token_in != fusdcAddress THEN token_in_decimals
		ELSE token_out_decimals
	END AS decimals,
	SUM(CASE
		WHEN token_in = fusdcAddress THEN amount_in
		ELSE amount_out
	END) AS cumulative_amount0,
	SUM(CASE
		WHEN token_in != fusdcAddress THEN amount_in
		ELSE amount_out
	END) AS cumulative_amount1
FROM swap_data
GROUP BY
	CASE
		WHEN token_in != fusdcAddress THEN token_in
		ELSE token_out
	END,
	CASE
		WHEN token_in != fusdcAddress THEN token_in_decimals
		ELSE token_out_decimals
	END;
$$;

CREATE FUNCTION swaps_decimals_pool_group_1(
	fusdcAddress ADDRESS,
	fusdcDecimals HUGEINT,
	poolAddress ADDRESS
)
RETURNS SETOF swaps_decimals_group_1_return
LANGUAGE SQL
STABLE
AS
$$
WITH swap_data AS (
	SELECT *
	FROM seawater_swaps_1(fusdcAddress, fusdcDecimals)
	WHERE
		token_in = poolAddress
		OR token_out = poolAddress
		OR token_in = fusdcAddress
		OR token_out = fusdcAddress
)
SELECT
	CASE
		WHEN token_in != fusdcAddress THEN token_in
		ELSE token_out
	END AS pool,
	CASE
		WHEN token_in != fusdcAddress THEN token_in_decimals
		ELSE token_out_decimals
	END AS decimals,
	SUM(CASE
		WHEN token_in = fusdcAddress THEN amount_in
		ELSE amount_out
	END) AS cumulative_amount0,
	SUM(CASE
		WHEN token_in != fusdcAddress THEN amount_in
		ELSE amount_out
	END) AS cumulative_amount1
FROM swap_data
GROUP BY
	CASE
		WHEN token_in != fusdcAddress THEN token_in
		ELSE token_out
	END,
	CASE
		WHEN token_in != fusdcAddress THEN token_in_decimals
		ELSE token_out_decimals
	END;
$$;

-- migrate:down
