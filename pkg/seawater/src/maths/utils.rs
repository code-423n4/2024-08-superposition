//! Various constants, used mostly in tests.
use crate::types::U256;

/// 0 as a 256 bit integer.
pub const RUINT_ZERO: U256 = U256::ZERO;
/// 1 as a 256 bit integer.
pub const RUINT_ONE: U256 = U256::from_limbs([1, 0, 0, 0]);
/// 2 as a 256 bit integer.
pub const RUINT_TWO: U256 = U256::from_limbs([2, 0, 0, 0]);
/// 3 as a 256 bit integer.
pub const RUINT_THREE: U256 = U256::from_limbs([3, 0, 0, 0]);
/// The largest 256 bit unsigned integer representable.
pub const RUINT_MAX_U256: U256 = U256::from_limbs([
    18446744073709551615,
    18446744073709551615,
    18446744073709551615,
    18446744073709551615,
]);
