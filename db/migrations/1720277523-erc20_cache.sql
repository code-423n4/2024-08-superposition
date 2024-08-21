-- migrate:up

CREATE TABLE erc20_cache_1 (
	id SERIAL PRIMARY KEY,
	address ADDRESS NOT NULL,
	name VARCHAR NOT NULL,
	symbol VARCHAR NOT NULL,
	total_supply HUGEINT NOT NULL,
	decimals INTEGER NOT NULL
);

CREATE UNIQUE INDEX ON erc20_cache_1 (address);

CREATE FUNCTION erc20_insert_1(
	a ADDRESS,
	n VARCHAR,
	s VARCHAR,
	t HUGEINT,
	d INTEGER
)
RETURNS void LANGUAGE plpgsql
AS $$
BEGIN
	INSERT INTO erc20_cache_1 (address, name, symbol, total_supply, decimals)
	VALUES (a, n, s, t, d)
	ON CONFLICT (address) DO NOTHING;
END $$;

-- migrate:down
