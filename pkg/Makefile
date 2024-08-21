
include config.mk

.PHONY: \
	build \
	seawater \
	admin \
	positions \
	update-positions \
	swaps \
	swap-permit2 \
	quotes \
	migrations \
	leo \
	solidity \
	amm-entrypoint \
	ownership-nfts \
	clean

all: build

build: solidity seawater leo

admin: ${OUT_SEAWATER_ADMIN}
positions: ${OUT_SEAWATER_POSITIONS}
update-positions: ${OUT_SEAWATER_UPDATE_POSITIONS}
swap-permit2: ${OUT_SEAWATER_SWAP_PERMIT2}
swaps: ${OUT_SEAWATER_SWAPS}
quotes: ${OUT_SEAWATER_QUOTES}
migrations: ${OUT_SEAWATER_MIGRATIONS}

leo: ${OUT_LEO}

seawater: admin positions update-positions swaps swap-permit2 quotes migrations

amm-entrypoint: ${OUT_SEAWATER_AMM}
ownership-nfts: ${OUT_OWNERSHIP_NFTS}

solidity: amm-entrypoint ownership-nfts

CARGO_BUILD_STYLUS := \
	cargo +nightly build \
		-Z build-std=std,panic_abort \
		-Z build-std-features=panic_immediate_abort \
		-Z unstable-options \
		--release \
		--target wasm32-unknown-unknown \
		--artifact-dir . \
		--package

FORGE_BUILD := forge build
DOCKER_BUILD := docker build

### SEAWATER

${OUT_SEAWATER_ADMIN}: ${FILES_RUST}
	@rm -f ${OUT_SEAWATER_ADMIN}
	@${CARGO_BUILD_STYLUS} seawater --features admin
	@mv seawater.wasm ${OUT_SEAWATER_ADMIN}
	@rm -f liblibseawater.rlib

${OUT_SEAWATER_POSITIONS}: ${FILES_RUST}
	@rm -f ${OUT_SEAWATER_POSITIONS}
	@${CARGO_BUILD_STYLUS} seawater --features positions
	@mv seawater.wasm ${OUT_SEAWATER_POSITIONS}
	@rm -f liblibseawater.rlib

${OUT_SEAWATER_UPDATE_POSITIONS}: ${FILES_RUST}
	@rm -f ${OUT_SEAWATER_UPDATE_POSITIONS}
	@${CARGO_BUILD_STYLUS} seawater --features update_positions
	@mv seawater.wasm ${OUT_SEAWATER_UPDATE_POSITIONS}
	@rm -f liblibseawater.rlib

${OUT_SEAWATER_SWAPS}: ${FILES_RUST}
	@rm -f ${OUT_SEAWATER_SWAPS}
	@${CARGO_BUILD_STYLUS} seawater --features swaps
	@mv seawater.wasm ${OUT_SEAWATER_SWAPS}
	@rm -f liblibseawater.rlib

${OUT_SEAWATER_SWAP_PERMIT2}: ${FILES_RUST}
	@rm -f ${OUT_SEAWATER_SWAP_PERMIT2}
	@${CARGO_BUILD_STYLUS} seawater --features swap_permit2
	@mv seawater.wasm ${OUT_SEAWATER_SWAP_PERMIT2}
	@rm -f liblibseawater.rlib

${OUT_SEAWATER_QUOTES}: ${FILES_RUST}
	@rm -f ${OUT_SEAWATER_QUOTES}
	@${CARGO_BUILD_STYLUS} seawater --features quotes
	@mv seawater.wasm ${OUT_SEAWATER_QUOTES}
	@rm -f liblibseawater.rlib

${OUT_SEAWATER_MIGRATIONS}: ${FILES_RUST}
	@rm -f ${OUT_SEAWATER_MIGRATIONS}
	@${CARGO_BUILD_STYLUS} seawater --features migrations
	@mv seawater.wasm ${OUT_SEAWATER_MIGRATIONS}
	@rm -f liblibseawater.rlib

${OUT_LEO}: ${FILES_RUST}
	@rm -f ${OUT_LEO}
	@${CARGO_BUILD_STYLUS} leo
	@rm -f liblibleo.rlib

### SOLIDITY

${OUT_SEAWATER_AMM}: ${FILES_SOLIDITY} ${FILES_RUST}
	@${FORGE_BUILD}

${OUT_OWNERSHIP_NFTS}: ${FILES_SOLIDITY} ${FILES_RUST}
	@${FORGE_BUILD}

docker: Dockerfile ${FILES_RUST} ${FILES_SOLIDITY}
	@${DOCKER_BUILD} -t fluidity/${REPO} .
	@touch docker

clean:
	@rm -rf \
		${OUT_SEAWATER_ADMIN} \
		${OUT_SEAWATER_POSITIONS} \
		${OUT_SEAWATER_UPDATE_POSITIONS} \
		${OUT_SEAWATER_SWAPS} \
		${OUT_SEAWATER_SWAP_PERMIT2} \
		${OUT_SEAWATER_QUOTES} \
		cache \
		target \
		out \
		docker \
		docs-out
