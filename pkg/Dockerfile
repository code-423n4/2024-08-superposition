
FROM rustlang/rust:nightly-bullseye-slim as build-1

RUN apt-get update && apt-get install -y curl

WORKDIR /tmp

RUN \
	curl -OL https://github.com/foundry-rs/foundry/releases/download/nightly-834d95921c77c89859118840863871984da1611d/foundry_nightly_linux_amd64.tar.gz && \
	gzip -d foundry_nightly_linux_amd64.tar.gz && \
	tar -xf foundry_nightly_linux_amd64.tar

FROM rustlang/rust:nightly-bullseye-slim as build-2

COPY --from=build-1 /tmp/forge /bin

RUN mkdir -p /usr/local/src/superposition/app.superposition.so

WORKDIR /usr/local/src/superposition/app.superposition.so

RUN apt-get update && apt-get install -y build-essential

RUN rustup component add rust-src --toolchain nightly-x86_64-unknown-linux-gnu

COPY . .

RUN make build

FROM debian:bullseye-slim as runtime

RUN mkdir -p /usr/local/superposition

WORKDIR /usr/local/superposition

COPY --from=build-2 /usr/local/src/superposition/app.superposition.so/seawater-admin.wasm .
COPY --from=build-2 /usr/local/src/superposition/app.superposition.so/seawater-positions.wasm .
COPY --from=build-2 /usr/local/src/superposition/app.superposition.so/seawater-update-positions.wasm .
COPY --from=build-2 /usr/local/src/superposition/app.superposition.so/seawater-swaps.wasm .
COPY --from=build-2 /usr/local/src/superposition/app.superposition.so/seawater-swap-permit2.wasm .

COPY --from=build-2 /usr/local/src/superposition/app.superposition.so/out solidity-out/
