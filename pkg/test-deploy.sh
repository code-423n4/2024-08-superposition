#!/bin/sh -x

export \
	STYLUS_ENDPOINT="http://localhost:8547" \
	STYLUS_PRIVATE_KEY="0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659" \
	SEAWATER_PROXY_ADMIN="0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E"

export FLU_SEAWATER_FUSDC_ADDR="$(\
	sh deploy-solidity.sh "LightweightERC20" \
		--constructor-args \
			"Fluid-USDC" \
			"fUSDC" \
			6 \
			100000000000000000000 \
			"$SEAWATER_PROXY_ADMIN")"

./deploy.sh
