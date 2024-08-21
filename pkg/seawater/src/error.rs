//! The [enum@Error] enum.

use alloc::vec::Vec;
use thiserror::Error;

/// Asserts that a boolean value is true at runtime, returning an Err if not.
///
/// # Uses
/// This must be used in a function that returns an appropriate [Result], since it uses `?` to
/// coerce the return value.
///
/// This should be used over [assert] in general, since panics don't give us good error messages in
/// stylus.
///
/// # Examples
///
/// ```
/// use libseawater::assert_or;
/// fn normal() -> Result<(), i32> {
///     assert_or!(true, 123);
///     Ok(())
/// }
/// fn fail() -> Result<(), i32> {
///     assert_or!(false, 123);
///     Ok(())
/// }
/// assert_eq!(normal(), Ok(()));
/// assert_eq!(fail(), Err(123));
/// ```
#[macro_export]
macro_rules! assert_or {
    ($cond:expr, $err:expr) => {
        if !($cond) {
            Err($err)?; // question mark forces coercion
        }
    };
}

/// Asserts that two values are equal at runtime, returning an Err if not.
/// See [assert_or].
#[macro_export]
macro_rules! assert_eq_or {
    ($a:expr, $b:expr, $err:expr) => {
        if !($a == $b) {
            Err($err)?;
        }
    };
}

/// Asserts that two values are not equal at runtime, returning an Err if not.
/// See [assert_or].
#[macro_export]
macro_rules! assert_neq_or {
    ($a:expr, $b:expr, $err:expr) => {
        if !($a != $b) {
            Err($err)?;
        }
    };
}

/// The list of possible errors the contract can return.
#[derive(Error, Debug)]
#[repr(u8)]
pub enum Error {
    // 0 (0x00)
    #[error("Denominator is 0")]
    DenominatorIsZero,

    // 1 (0x01)
    #[error("Result is U256::MAX")]
    ResultIsU256MAX,

    // 2 (0x02)
    #[error("Sqrt price is 0")]
    SqrtPriceIsZero,

    // 3 (0x03)
    #[error("Sqrt price is less than or equal to quotient")]
    SqrtPriceIsLteQuotient,

    // 4 (0x04)
    #[error("Can not get most significant bit or least significant bit on zero value")]
    ZeroValue,

    // 5 (0x05)
    #[error("Liquidity is 0")]
    LiquidityIsZero,

    // 6 (0x06)
    #[error(
        "require((product = amount * sqrtPX96) / amount == sqrtPX96 && numerator1 > product);"
    )]
    ProductDivAmount,

    // 7 (0x07)
    #[error("Denominator is less than or equal to prod_1")]
    DenominatorIsLteProdOne,

    // 8 (0x08)
    #[error("Liquidity Sub")]
    LiquiditySub,

    // 9 (0x09)
    #[error("Liquidity Add")]
    LiquidityAdd,

    // 10 (0x0a)
    #[error("The given tick must be less than, or equal to, the maximum tick")]
    T,

    // 11 (0x0b)
    #[error(
        "Second inequality must be < because the price can never reach the price at the max tick"
    )]
    R,

    // 12 (0x0c)
    #[error("Overflow when casting to U160")]
    SafeCastToU160Overflow,

    // 13 (0x0d)
    #[error("Liquidity higher than max")]
    LiquidityTooHigh,

    // 14 (0x0e)
    #[error("Fee growth sub overflow position")]
    FeeGrowthSubPos,

    // 15 (0x0f)
    #[error("ERC20 call reverted")]
    Erc20Revert(Vec<u8>),

    // 16 (0x10)
    #[error("ERC20 call reverted with no data")]
    Erc20RevertNoData,

    // 17 (0x11)
    #[error("Pool is already initialised")]
    PoolAlreadyInitialised,

    // 18 (0x012)
    #[error("Contract is already initialised")]
    ContractAlreadyInitialised,

    #[error("Price limit too high")]
    // 19 (0x13)
    PriceLimitTooHigh,

    // 20 (0x14)
    #[error("Price limit too low")]
    PriceLimitTooLow,

    // 21 (0x15)
    #[error("Checked abs called on an unexpected positive number")]
    CheckedAbsIsNegative,

    // 22 (0x16)
    #[error("Checked abs called on an unexpected negative number")]
    CheckedAbsIsPositive,

    // 23 (0x17)
    #[error("Checked abs called on uint.min")]
    AbsTooLow,

    // 24 (0x18)
    #[error("Fee result too high")]
    FeeTooHigh,

    // 25 (0x19)
    #[error("Swap result too high")]
    SwapResultTooHigh,

    // 26 (0x1a)
    #[error("Internal swap amounts not matched")]
    InterimSwapNotEq,

    // 27 (0x1b)
    #[error("Internal swap result was positive")]
    InterimSwapPositive,

    // 28 (0x1c)
    #[error("Minimum out not reached")]
    MinOutNotReached,

    // 29 (0x1d)
    #[error("Only the position owner can use this")]
    PositionOwnerOnly,

    // 30 (0x1e)
    #[error("Only the NFT manager can use this")]
    NftManagerOnly,

    // 31 (0x1f)
    #[error("Only the Seawater admin can use this")]
    SeawaterAdminOnly,

    // 32 (0x20)
    #[error("Operation unavailable when the pool is disabled")]
    PoolDisabled,

    // 33 (0x21)
    #[error("Invalid tick spacing")]
    InvalidTickSpacing,

    // 34 (0x22)
    #[error("Swap result too low")]
    SwapResultTooLow,

    // 35 (0x23)
    #[error("Liquidity amount too low or high to be a int128")]
    LiquidityAmountTooWide,

    // 36 (0x24)
    #[error("Invalid tick")]
    InvalidTick,

    // 37 (0x25)
    #[error("Pool enabled")]
    PoolEnabled,

    // 38 (0x26)
    #[error("Position is empty when it shouldn't be")]
    EmptyPosition,

    // 39 (0x27)
    #[error("Liquidity that was taken is too low")]
    LiqResultTooLow,

    // 40 (0x28)
    #[error("Fee growth sub overflow tick")]
    FeeGrowthSubTick,

    // 41 (0x29)
    #[error("The emergency council can only disable pools")]
    SeawaterEmergencyOnlyDisable,
}

impl From<Error> for Vec<u8> {
    // tests return the message
    #[cfg(not(target_arch = "wasm32"))]
    fn from(val: Error) -> Self {
        val.to_string().into()
    }

    // runtime returns the message code to save binary size
    // TODO - once errors are mostly finalised we should find a way to return actual solidity
    // errors
    #[cfg(target_arch = "wasm32")]
    fn from(val: Error) -> Self {
        // cast the enum to its descriminant
        // https://doc.rust-lang.org/std/mem/fn.discriminant.html
        let id = unsafe { *<*const _>::from(&val).cast::<u8>() };

        let mut e = vec![id];

        if let Error::Erc20Revert(mut err) = val {
            e.append(&mut err);
        }

        e
    }
}
