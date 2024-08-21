use stylus_sdk::alloy_primitives::{Address, I32, U256};

#[allow(unused_imports)]
use stylus_sdk::call::RawCall;

#[allow(unused_imports)]
use crate::{calldata::*, immutables::SEAWATER_ADDR};

#[cfg(not(target_arch = "wasm32"))]
use crate::host;

//collectSingleTo720C50FF(address,uint256,address)
#[allow(dead_code)]
const COLLECT_YIELD_SINGLE_TO_SELECTOR: [u8; 4] = [0xd2, 0xb3, 0x16, 0x5c];

//positionTickLower2F77CCE1(address,uint256)
#[allow(dead_code)]
const TICK_LOWER_SELECTOR: [u8; 4] = [0x00, 0x00, 0x02, 0xec];

//positionTickUpper67FD55BA(address,uint256)
#[allow(dead_code)]
const TICK_UPPER_SELECTOR: [u8; 4] = [0x00, 0x00, 0x02, 0x4a];

//positionLiquidity8D11C045(address,uint256)
#[allow(dead_code)]
const POSITION_LIQUIDITY_SELECTOR: [u8; 4] = [0x00, 0x00, 0x02, 0x5b];

#[cfg(target_arch = "wasm32")]
/// Collect yield, using the [collect_7_F21947_C] function in Longtail.
pub fn collect_yield_single_to(id: U256, pool: Address, recipient: Address) -> (u128, u128) {
    let mut data = [0_u8; 4 + 32 * 3];
    write_selector(&mut data, &COLLECT_YIELD_SINGLE_TO_SELECTOR);
    write_u256(&mut data, 0, id);
    write_address(&mut data, 1, pool);
    write_address(&mut data, 2, recipient);
    let rd = RawCall::new().call(SEAWATER_ADDR, &data).unwrap();
    panic!("todo")
}

#[cfg(not(target_arch = "wasm32"))]
pub fn collect_yield_single_to(id: U256, pool: Address, recipient: Address) -> (u128, u128) {
    (0, 0)
}

#[cfg(target_arch = "wasm32")]
pub fn tick_lower(pool: Address, id: U256) -> I32 {
    let mut data = [0_u8; 4 + 32 * 2];
    write_selector(&mut data, &TICK_LOWER_SELECTOR);
    write_address(&mut data, 0, pool);
    write_u256(&mut data, 1, id);
    let t = RawCall::new().call(SEAWATER_ADDR, &data).unwrap();
    panic!("TODO")
}

#[cfg(not(target_arch = "wasm32"))]
pub fn tick_lower(_pool: Address, id: U256) -> I32 {
    I32::try_from(host::position_tick_lower(id).unwrap()).unwrap()
}

#[cfg(target_arch = "wasm32")]
pub fn tick_upper(pool: Address, id: U256) -> I32 {
    let mut data = [0_u8; 4 + 32 * 2];
    write_selector(&mut data, &TICK_UPPER_SELECTOR);
    write_address(&mut data, 0, pool);
    write_u256(&mut data, 1, id);
    RawCall::new().call(SEAWATER_ADDR, &data).unwrap();
    I32::ZERO
}

#[cfg(not(target_arch = "wasm32"))]
pub fn tick_upper(pool: Address, id: U256) -> I32 {
    I32::try_from(host::position_tick_upper(id).unwrap()).unwrap()
}

#[cfg(target_arch = "wasm32")]
pub fn position_liquidity(pool: Address, id: U256) -> U256 {
    let mut data = [0_u8; 4 + 32 * 2];
    write_selector(&mut data, &POSITION_LIQUIDITY_SELECTOR);
    write_address(&mut data, 0, pool);
    write_u256(&mut data, 1, id);
    let cd = RawCall::new().call(SEAWATER_ADDR, &data).unwrap();
    panic!("TODO")
}

#[cfg(not(target_arch = "wasm32"))]
pub fn position_liquidity(_pool: Address, id: U256) -> U256 {
    host::position_liquidity(id).unwrap()
}
