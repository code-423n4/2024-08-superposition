#!/bin/sh -eu

wasm_file="$1"

cargo stylus deploy \
	--endpoint $STYLUS_ENDPOINT \
	--wasm-file "$wasm_file" \
	--private-key $STYLUS_PRIVATE_KEY \
	        | sed -nr 's/.*deployed code at address: +.*(0x.{40}).*$/\1/p'
