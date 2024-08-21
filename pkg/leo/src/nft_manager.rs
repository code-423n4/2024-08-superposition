#[allow(unused_imports)]
use stylus_sdk::{
    alloy_primitives::{Address, U256},
    call::RawCall,
    contract, msg,
};

use crate::calldata::*;

#[cfg(target_arch = "wasm32")]
use crate::immutables::NFT_MANAGER_ADDR;

//transferFrom(address,address,uint256)
#[allow(dead_code)]
const TRANSFER_FROM_POSITION_SELECTOR: [u8; 4] = [0x23, 0xb8, 0x72, 0xdd];

#[allow(dead_code)]
fn pack_transfer_from(from: Address, to: Address, id: U256) -> [u8; 4 + 32 * 3] {
    let mut data = [0_u8; 4 + 32 * 3];
    write_selector(&mut data, &TRANSFER_FROM_POSITION_SELECTOR);
    write_address(&mut data, 0, from);
    write_address(&mut data, 1, to);
    write_u256(&mut data, 2, id);
    data
}

#[cfg(target_arch = "wasm32")]
pub fn take_position(id: U256) {
    let _ = RawCall::new()
        .call(
            NFT_MANAGER_ADDR,
            &pack_transfer_from(msg::sender(), contract::address(), id),
        )
        .unwrap();
}

#[cfg(not(target_arch = "wasm32"))]
pub fn take_position(id: U256) {
    // Do nothing, we can trust the system to be permissionless with ownership in testing.
}

#[cfg(target_arch = "wasm32")]
pub fn give_position(id: U256) {
    let _ = RawCall::new()
        .call(
            NFT_MANAGER_ADDR,
            &pack_transfer_from(contract::address(), msg::sender(), id),
        )
        .unwrap();
}

#[cfg(not(target_arch = "wasm32"))]
pub fn give_position(id: U256) {}
