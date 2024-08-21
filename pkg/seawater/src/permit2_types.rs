use crate::types::U256;

#[derive(Debug)]
pub struct Permit2Args<'a> {
    pub max_amount: U256,
    pub nonce: U256,
    pub deadline: U256,
    pub sig: &'a [u8],
}
