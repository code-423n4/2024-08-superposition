#!/bin/sh -e

export \
	SPN_GETH_URL=http://localhost:8547 \
	RUST_BACKTRACE=1

cargo test --package seawater --features testing

node --test --loader tsx ethers-tests/seawater.ts
