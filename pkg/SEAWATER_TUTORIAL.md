
# Seawater Tutorial

This tutorial walks would-be developers through **installing dependencies**, **building**,
and **testing** Seawater (Longtail).

Longtail is a Concentrated Liquidity (V3) style AMM powered by Arbitrum Stylus, a WASM
frontend to the EVM.

Development on this repo is done with the following tools:

1. `Rust` and `Cargo` - The Rust programming language, and it's package manager.
2. `cargo-stylus` - A Cargo subcommand that simplifies Stylus deployment, building, and
testing.
3. `make` - A tool for executing commands based on the edited time of a graph of files.
4. `Typescript` - A strongly typed language frontend to Javascript.
5. `Ethers` - A Typescript package for interacting with the Ethereum blockchain.
6. `Forge Foundry` - A testing suite for instrumenting mainly Solidity code.
7. `Nitro Testsuite` - A local node for testing Stylus contracts.
8. `Docker` - A noteworthy transitive dependency needed by Nitro. A container tool.
9. `Bash` - A common shell on Linux-based operating systems.

These tools are used to build and test different parts of the repo. Typescript is used
with Ethers to do end to end testing with real ERC20, Forge is used to test and compile
the Solidity code to EVM bytecode, and Rust, Cargo Stylus and Make is used to build the
Stylus code.

## What is WASM?

WASM is an open bytecode format that was originally intended for the web browser. It's
size efficiency and open development led it to be adopted by the web3 industry.

## Installation

First, install Rust:

	# https://rustup.rs/
	curl -LsSf https://sh.rustup.rs | sh

Second, install `cargo stylus`:

	cargo install cargo-stylus

This will install the `cargo stylus` command.

Next, install the wasm target to Rust, to compile wasm binaries:

	rustup target add wasm32-unknown-unknown

Great! That's Rust and the Stylus tooling out of the way.

Next, we need to install Node and Typescript. You may already have `npm` or `pnpm`
installed, both of which are suitable for this repo.

If you don't, it's worth installing Node Version Manager.

	# https://github.com/nvm-sh/nvm
	curl -LSsf https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

This will let you manage your Node version:

	nvm use 22

Npm will come installed, which is fine for us.

We next install Foundry:

	#https://book.getfoundry.sh/getting-started/installation
	curl -LsSf https://foundry.paradigm.xyz | sh

We also pull and configure the Nitro testnode:

## Building

