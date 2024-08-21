#!/bin/sh -e

# Uses several environment variables to skip deployment where it's possible! Please read the
# source of this script before using!

log() {
	>&2 echo $@
}

err() {
	log $@
	exit 1
}

[ -z "$SEAWATER_PROXY_ADMIN" ] && err "SEAWATER_PROXY_ADMIN unset"
[ -z "$SEAWATER_EMERGENCY_COUNCIL" ] && err "SEAWATER_EMERGENCY_COUNCIL unset"
[ -z "$STYLUS_ENDPOINT" ] && err "STYLUS_ENDPOINT unset"
[ -z "$STYLUS_PRIVATE_KEY" ] && err "STYLUS_PRIVATE_KEY unset"
[ -z "$FLU_SEAWATER_FUSDC_ADDR" ] && err "FLU_SEAWATER_FUSDC_ADDR unset"

[ -z "$SEAWATER_SWAPS" ] && SEAWATER_SWAPS="$(sh deploy-seawater.sh seawater-swaps.wasm)"
[ -z "$SEAWATER_SWAPS" ] && err "Failed to deploy seawater_swaps"
log "SEAWATER_SWAPS=$SEAWATER_SWAPS"

[ -z "$SEAWATER_SWAP_PERMIT2" ] && SEAWATER_SWAP_PERMIT2="$(sh deploy-seawater.sh seawater-swap-permit2.wasm)"
[ -z "$SEAWATER_SWAP_PERMIT2" ] && err "Failed to deploy seawater_swap_permit2"
log "SEAWATER_SWAP_PERMIT2=$SEAWATER_SWAP_PERMIT2"

[ -z "$SEAWATER_QUOTES" ] && SEAWATER_QUOTES="$(sh deploy-seawater.sh seawater-quotes.wasm)"
[ -z "$SEAWATER_QUOTES" ] && err "Failed to deploy seawater_quotes"
log "SEAWATER_QUOTES=$SEAWATER_QUOTES"

[ -z "$SEAWATER_POSITIONS" ] && SEAWATER_POSITIONS="$(sh deploy-seawater.sh seawater-positions.wasm)"
[ -z "$SEAWATER_POSITIONS" ] && err "Failed to deploy seawater_positions"
log "SEAWATER_POSITIONS=$SEAWATER_POSITIONS"

[ -z "$SEAWATER_UPDATE_POSITIONS" ] && SEAWATER_UPDATE_POSITIONS="$(sh deploy-seawater.sh seawater-update-positions.wasm)"
[ -z "$SEAWATER_UPDATE_POSITIONS" ] && err "Failed to deploy seawater_update_positions"
log "SEAWATER_UPDATE_POSITIONS=$SEAWATER_UPDATE_POSITIONS"

[ -z "$SEAWATER_ADMIN" ] && SEAWATER_ADMIN="$(sh deploy-seawater.sh seawater-admin.wasm)"
[ -z "$SEAWATER_ADMIN" ] && err "Failed to deploy seawater_admin"
log "SEAWATER_ADMIN=$SEAWATER_ADMIN"

seawater_proxy="$(\
	sh deploy-solidity.sh "SeawaterAMM" --constructor-args \
		"$SEAWATER_PROXY_ADMIN" \
		"$SEAWATER_PROXY_ADMIN" \
		"$(cast --address-zero)" \
		"$SEAWATER_EMERGENCY_COUNCIL" \
		"$SEAWATER_SWAPS" \
		"$SEAWATER_SWAP_PERMIT2" \
		"$SEAWATER_QUOTES" \
		"$SEAWATER_POSITIONS" \
		"$SEAWATER_UPDATE_POSITIONS" \
		"$SEAWATER_ADMIN" \
		"$(cast --address-zero)")"
[ -z "$seawater_proxy" ] && err "Failed to deploy seawater_proxy"
log "Seawater proxy deployed to $seawater_proxy"

cat <<EOF
{
	"seawater_proxy": "$seawater_proxy",
	"seawater_swaps_impl": "$SEAWATER_SWAPS",
	"seawater_swap_permit2_impl": "$SEAWATER_SWAP_PERMIT2",
	"seawater_quotes_impl": "$SEAWATER_QUOTES",
	"seawater_positions_impl": "$SEAWATER_POSITIONS",
	"seawater_update_positions_impl": "$SEAWATER_UPDATE_POSITIONS",
	"seawater_admin_impl": "$SEAWATER_ADMIN",
	"seawater_proxy_admin": "$SEAWATER_PROXY_ADMIN",
	"seawater_fusdc_addr": "$FLU_SEAWATER_FUSDC_ADDR"
}
EOF
