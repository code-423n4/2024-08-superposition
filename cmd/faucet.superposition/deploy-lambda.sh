#!/bin/sh -eu

function_name="$1"

aws lambda update-function-code \
	--function-name "$function_name" \
	--zip-file "$zip_file"
