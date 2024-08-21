//! Unchecked maths operations.

use crate::types::{U256Extension, U256};

/// Returns `a / b`, rounded up.
pub fn div_rounding_up(a: U256, b: U256) -> U256 {
    let (quotient, remainder) = a.div_rem(b);
    if remainder.is_zero() {
        quotient
    } else {
        quotient + U256::one()
    }
}
