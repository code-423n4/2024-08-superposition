//! Reexports and extension traits for stylus' bigint types.

// reexport so we can keep the types the same
pub use stylus_sdk;

use crate::error::Error;

/// 256 bit unsigned integer.
pub type U256 = stylus_sdk::alloy_primitives::U256;

/// Extension trait to add methods to the [U256] type.
pub trait U256Extension: Sized {
    /// Returns if the integer is zero.
    fn is_zero(&self) -> bool;
    /// Returns 0 as a [U256].
    fn zero() -> Self;
    /// Returns 1 as a [U256].
    fn one() -> Self;

    /// Converts an 0x prefixed hex string to a [U256]. Only allowed in tests.
    #[cfg(test)]
    fn from_hex_str(value: &str) -> Self;
    /// Converts a decimal string to a [U256]. Only allowed in tests.
    #[cfg(test)]
    fn from_dec_str(value: &str) -> Option<Self>;
}

/// [U256] should be the only implementor of this trait.
impl U256Extension for U256 {
    fn is_zero(&self) -> bool {
        self == &Self::zero()
    }

    fn zero() -> Self {
        Self::ZERO
    }

    fn one() -> Self {
        // little endian
        Self::from_limbs([1, 0, 0, 0])
    }

    #[cfg(test)]
    fn from_hex_str(value: &str) -> Self {
        debug_assert!(value.starts_with("0x"));
        value.parse().unwrap()
    }

    #[cfg(test)]
    fn from_dec_str(value: &str) -> Option<Self> {
        debug_assert!(!value.starts_with("0x"));
        value.parse().ok()
    }
}

/// 256 bit signed integer.
pub type I256 = stylus_sdk::alloy_primitives::I256;

/// Extension trait to add methods to the [I256] type.
pub trait I256Extension: Sized {
    /// Returns 0 as an [I256].
    fn zero() -> Self;
    /// Returns 1 as an [I256].
    fn one() -> Self;
    /// Asserts that the number is negative, and returns the absolute value as a [U256].
    fn abs_neg(self) -> Result<U256, Error>;
    /// Asserts that the number is positive, and returns the absolute value as a [U256].
    fn abs_pos(self) -> Result<U256, Error>;
}

/// [I256] should be the only implementor of this trait.
impl I256Extension for I256 {
    fn zero() -> Self {
        Self::ZERO
    }

    fn one() -> Self {
        Self::ONE
    }

    fn abs_neg(self) -> Result<U256, Error> {
        if self.is_positive() {
            return Err(Error::CheckedAbsIsNegative);
        }
        Ok(self.checked_abs().ok_or(Error::AbsTooLow)?.into_raw())
    }
    fn abs_pos(self) -> Result<U256, Error> {
        if self.is_negative() {
            return Err(Error::CheckedAbsIsPositive);
        }
        Ok(self.checked_abs().ok_or(Error::AbsTooLow)?.into_raw())
    }
}

/// Re-export of the U160 type.
pub type U160 = stylus_sdk::alloy_primitives::U160;
/// Re-export of the U128 type.
pub type U128 = stylus_sdk::alloy_primitives::U128;
/// Re-export of the U32 type.
pub type U32 = stylus_sdk::alloy_primitives::U32;
/// Re-export of the U8 type.
pub type U8 = stylus_sdk::alloy_primitives::U8;

/// Re-export of the I128 type.
pub type I128 = stylus_sdk::alloy_primitives::I128;
/// Re-export of the I64 type.
pub type I64 = stylus_sdk::alloy_primitives::I64;
/// Re-export of the I32 type.
pub type I32 = stylus_sdk::alloy_primitives::I32;

/// Re-export of the Address type.
pub type Address = stylus_sdk::alloy_primitives::Address;

/// Ersatz [From] and [Into]. Converts a type between a primitive and a wrapped library type.
///
/// (These exist because we can't implement a foreign trait on a foreign type.)
pub trait WrappedNative<W> {
    /// Converts a wrapped type to a primitive type.
    fn sys(&self) -> W;
    /// Converts a primitive type to a wrapped (library) type.
    fn lib(arg: &W) -> Self;
}

impl WrappedNative<i128> for I128 {
    fn sys(&self) -> i128 {
        i128::from_le_bytes(self.to_le_bytes())
    }

    fn lib(arg: &i128) -> Self {
        I128::from_le_bytes(arg.to_le_bytes())
    }
}
impl WrappedNative<u128> for U128 {
    fn sys(&self) -> u128 {
        u128::from_le_bytes(self.to_le_bytes())
    }

    fn lib(arg: &u128) -> Self {
        U128::from_le_bytes(arg.to_le_bytes())
    }
}
impl WrappedNative<i32> for I32 {
    fn sys(&self) -> i32 {
        self.as_i32()
    }

    fn lib(arg: &i32) -> Self {
        I32::unchecked_from(*arg)
    }
}
impl WrappedNative<u8> for U8 {
    fn sys(&self) -> u8 {
        self.as_limbs()[0] as u8
    }

    fn lib(arg: &u8) -> Self {
        Self::from_limbs([*arg as u64])
    }
}

impl WrappedNative<u32> for U32 {
    fn sys(&self) -> u32 {
        self.as_limbs()[0] as u32
    }

    fn lib(arg: &u32) -> Self {
        Self::from_limbs([*arg as u64])
    }
}
