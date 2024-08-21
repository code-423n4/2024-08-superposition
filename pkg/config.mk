
REPO := app.superposition.so-contracts

FILES_RUST := \
	$(shell find \
		-path ./target -prune \
		-or -name '*.rs' -print \
		-or -name '*.toml' -print)

FILES_SOLIDITY := \
	$(shell find \
		-path ./out -prune \
		-or -name '*.sol' -print)

OUT_SEAWATER_ADMIN := seawater-admin.wasm
OUT_SEAWATER_POSITIONS := seawater-positions.wasm
OUT_SEAWATER_UPDATE_POSITIONS := seawater-update-positions.wasm
OUT_SEAWATER_SWAPS := seawater-swaps.wasm
OUT_SEAWATER_SWAP_PERMIT2 := seawater-swap-permit2.wasm
OUT_SEAWATER_QUOTES := seawater-quotes.wasm
OUT_SEAWATER_MIGRATIONS := seawater-migrations.wasm

OUT_LEO := leo.wasm

OUT_SEAWATER_AMM := out/SeawaterAMM.sol/SeawaterAMM.json
OUT_OWNERSHIP_NFTS := out/OwnershipNFTs.sol/OwnershipNFTs.json
