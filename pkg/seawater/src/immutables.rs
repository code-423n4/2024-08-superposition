//! Per-deployment constants, intended to be used the same way `immutable` variables are in
//! solidity

use crate::types::Address;

#[cfg(target_arch = "wasm32")]
macro_rules! addr {
    ($input:literal) => {
        Address::new(
            match const_hex::const_decode_to_array::<20>(env!($input).as_bytes()) {
                Ok(res) => res,
                Err(_) => panic!(),
            },
        )
    };
}

// test only implementation that returns a dummy value (so you can pick it from logs)
#[cfg(not(target_arch = "wasm32"))]
macro_rules! addr {
    ($_input:literal) => {
        // this says "fluidity_1" if you squint
        Address::new([
            0xf1, 0x01, 0xd1, 0x73, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
        ])
    };
}

/// The address of the permit2 contract.
pub const PERMIT2_ADDR: Address = addr!("FLU_SEAWATER_PERMIT2_ADDR");

/// The address of the fluid token, to be used as token 1 for every pool.
pub const FUSDC_ADDR: Address = addr!("FLU_SEAWATER_FUSDC_ADDR");
