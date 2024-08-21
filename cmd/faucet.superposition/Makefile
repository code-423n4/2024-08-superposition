
include ../golang.mk

.PHONY: lambda

lambda: bootstrap.zip

bootstrap: faucet.superposition
	@cp faucet.superposition bootstrap

bootstrap.zip: bootstrap
	@zip bootstrap.zip bootstrap
