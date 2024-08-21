//! Pure functions implementing the core uniswap v3 maths.
//!
//! Adapted from [0xKitsune's port](https://github.com/0xKitsune/uniswap-v3-math) of uniswap v3's
//! maths to rust, with some modifications for code size optimisation.
//!
//! Most of these files are direct ports of uniswap v3's
//! [libraries](https://github.com/Uniswap/v3-core/tree/main/contracts/libraries).

pub mod bit_math;
pub mod full_math;
pub mod liquidity_math;
pub mod sqrt_price_math;
pub mod swap_math;
pub mod tick_bitmap;
pub mod tick_math;
pub mod unsafe_math;
pub mod utils;
