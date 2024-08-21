#!/bin/sh -ue

name="$1"

shift

forge create "$name" \
	--json \
	--rpc-url="$STYLUS_ENDPOINT" \
	--private-key="$STYLUS_PRIVATE_KEY" \
	$@ \
		| jq -r .deployedTo
