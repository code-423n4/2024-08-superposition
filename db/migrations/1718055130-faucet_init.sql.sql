-- migrate:up

CREATE TABLE faucet_requests (
	id SERIAL PRIMARY KEY,
	addr ADDRESS NOT NULL,
	ip_addr VARCHAR NOT NULL,
	created_by TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	updated_by TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- migrate:down
