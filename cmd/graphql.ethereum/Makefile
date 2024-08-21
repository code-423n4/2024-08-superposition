
EXTRA_FILES := pools.toml

include ../golang.mk

pools.toml: ${CONFIG_DIR}/pools.toml
	@cp ${CONFIG_DIR}/pools.toml .

.PHONY: lambda

lambda: bootstrap.zip

bootstrap: graphql.ethereum
	@cp graphql.ethereum bootstrap

bootstrap.zip: bootstrap
	@zip bootstrap.zip bootstrap
