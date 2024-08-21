use stylus_sdk::alloy_primitives::{Address, U256};

pub fn write_selector(bytes: &mut [u8], selector: &[u8; 4]) {
    bytes[0..4].copy_from_slice(&selector[..])
}
pub fn write_address(bytes: &mut [u8], slot: usize, address: Address) {
    bytes[4 + 32 * slot + 12..4 + 32 * slot + 32].copy_from_slice(&address.0 .0)
}
pub fn write_u256(bytes: &mut [u8], slot: usize, uint: U256) {
    bytes[4 + 32 * slot..4 + 32 * slot + 32].copy_from_slice(&uint.to_be_bytes::<32>())
}
