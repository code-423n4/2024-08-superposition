use stylus_sdk::alloy_primitives::Address;

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

#[allow(dead_code)]
pub const SEAWATER_ADDR: Address = addr!("FLU_SEAWATER_ADDR");

#[allow(dead_code)]
pub const NFT_MANAGER_ADDR: Address = addr!("FLU_NFT_MANAGER_ADDR");
