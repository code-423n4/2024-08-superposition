//! Functions that operate on X96 encoded square root prices.

use crate::types::{I256, U256};
use crate::{
    error::Error,
    maths::{
        full_math::{mul_div, mul_div_rounding_up},
        unsafe_math::div_rounding_up,
    },
};
use num_traits::cast::ToPrimitive;
use ruint_macro::uint;

/// The maximum value storable in a 160-bit unsigned integer.
pub const MAX_U160: U256 =
    U256::from_limbs([18446744073709551615, 18446744073709551615, 4294967295, 0]);
/// 2^96, used for normalising 96-bit fixed point numbers.
pub const Q96: U256 = U256::from_limbs([0, 4294967296, 0, 0]);
/// 96, used to encode the resolution of 96-bit fixed point numbers.
pub const FIXED_POINT_96_RESOLUTION: U256 = U256::from_limbs([96, 0, 0, 0]);
/// 96, used to encode the resolution of 96-bit fixed point numbers, as a [usize].
pub const FIXED_POINT_96_RESOLUTION_USIZE: usize = 96;

/// Calculates the next square root price from a starting price, a token delta, and a direction.
pub fn get_next_sqrt_price_from_input(
    sqrt_price: U256,
    liquidity: u128,
    amount_in: U256,
    zero_for_one: bool,
) -> Result<U256, Error> {
    if sqrt_price.is_zero() {
        return Err(Error::SqrtPriceIsZero);
    } else if liquidity == 0 {
        return Err(Error::LiquidityIsZero);
    }

    if zero_for_one {
        get_next_sqrt_price_from_amount_0_rounding_up(sqrt_price, liquidity, amount_in, true)
    } else {
        get_next_sqrt_price_from_amount_1_rounding_down(sqrt_price, liquidity, amount_in, true)
    }
}

/// Calculates the next square root price from a starting price and an output token amount.
pub fn get_next_sqrt_price_from_output(
    sqrt_price: U256,
    liquidity: u128,
    amount_out: U256,
    zero_for_one: bool,
) -> Result<U256, Error> {
    if sqrt_price.is_zero() {
        return Err(Error::SqrtPriceIsZero);
    } else if liquidity == 0 {
        return Err(Error::LiquidityIsZero);
    }

    if zero_for_one {
        get_next_sqrt_price_from_amount_1_rounding_down(sqrt_price, liquidity, amount_out, false)
    } else {
        get_next_sqrt_price_from_amount_0_rounding_up(sqrt_price, liquidity, amount_out, false)
    }
}

/// Calculates the next square root price from a starting price and an input amount of token0.
pub fn get_next_sqrt_price_from_amount_0_rounding_up(
    sqrt_price_x_96: U256,
    liquidity: u128,
    amount: U256,
    add: bool,
) -> Result<U256, Error> {
    if amount.is_zero() {
        return Ok(sqrt_price_x_96);
    }

    let numerator_1: U256 = U256::from(liquidity) << 96;

    if add {
        let product = amount.wrapping_mul(sqrt_price_x_96);

        if product.wrapping_div(amount) == sqrt_price_x_96 {
            let denominator = numerator_1.wrapping_add(product);

            if denominator >= numerator_1 {
                return mul_div_rounding_up(numerator_1, sqrt_price_x_96, denominator);
            }
        }

        Ok(div_rounding_up(
            numerator_1,
            (numerator_1.wrapping_div(sqrt_price_x_96)).wrapping_add(amount),
        ))
    } else {
        let product = amount.wrapping_mul(sqrt_price_x_96);
        if product.wrapping_div(amount) == sqrt_price_x_96 && numerator_1 > product {
            let denominator = numerator_1.wrapping_sub(product);

            mul_div_rounding_up(numerator_1, sqrt_price_x_96, denominator)
        } else {
            Err(Error::ProductDivAmount)
        }
    }
}

/// Calculates the next square root price from a starting price and an input amount of token1.
pub fn get_next_sqrt_price_from_amount_1_rounding_down(
    sqrt_price_x_96: U256,
    liquidity: u128,
    amount: U256,
    add: bool,
) -> Result<U256, Error> {
    let liquidity = U256::from(liquidity);

    if add {
        let quotient = if amount <= MAX_U160 {
            (amount << FIXED_POINT_96_RESOLUTION) / liquidity
        } else {
            mul_div(amount, Q96, liquidity)?
        };

        let next_sqrt_price = sqrt_price_x_96 + quotient;

        if next_sqrt_price > MAX_U160 {
            Err(Error::SafeCastToU160Overflow)
        } else {
            Ok(next_sqrt_price)
        }
    } else {
        let quotient = if amount <= MAX_U160 {
            div_rounding_up(amount << FIXED_POINT_96_RESOLUTION, liquidity)
        } else {
            mul_div_rounding_up(amount, Q96, liquidity)?
        };

        //require(sqrtPX96 > quotient);
        if sqrt_price_x_96 <= quotient {
            return Err(Error::SqrtPriceIsLteQuotient);
        }

        Ok(sqrt_price_x_96.overflowing_sub(quotient).0)
    }
}

/// Calculates the delta of token 0 between two prices.
pub fn _get_amount_0_delta(
    mut sqrt_ratio_a_x_96: U256,
    mut sqrt_ratio_b_x_96: U256,
    liquidity: u128,
    round_up: bool,
) -> Result<U256, Error> {
    if sqrt_ratio_a_x_96 > sqrt_ratio_b_x_96 {
        (sqrt_ratio_a_x_96, sqrt_ratio_b_x_96) = (sqrt_ratio_b_x_96, sqrt_ratio_a_x_96)
    };

    let numerator_1 = U256::from(liquidity) << 96;
    let numerator_2 = sqrt_ratio_b_x_96 - sqrt_ratio_a_x_96;

    if sqrt_ratio_a_x_96.is_zero() {
        return Err(Error::SqrtPriceIsZero);
    }

    if round_up {
        let numerator_partial = mul_div_rounding_up(numerator_1, numerator_2, sqrt_ratio_b_x_96)?;
        Ok(div_rounding_up(numerator_partial, sqrt_ratio_a_x_96))
    } else {
        Ok(mul_div(numerator_1, numerator_2, sqrt_ratio_b_x_96)? / sqrt_ratio_a_x_96)
    }
}

/// Calculates the delta of token 1 between two prices.
pub fn _get_amount_1_delta(
    mut sqrt_ratio_a_x_96: U256,
    mut sqrt_ratio_b_x_96: U256,
    liquidity: u128,
    round_up: bool,
) -> Result<U256, Error> {
    if sqrt_ratio_a_x_96 > sqrt_ratio_b_x_96 {
        (sqrt_ratio_a_x_96, sqrt_ratio_b_x_96) = (sqrt_ratio_b_x_96, sqrt_ratio_a_x_96)
    };

    if round_up {
        mul_div_rounding_up(
            U256::from(liquidity),
            sqrt_ratio_b_x_96 - sqrt_ratio_a_x_96,
            uint!(0x1000000000000000000000000_U256),
        )
    } else {
        mul_div(
            U256::from(liquidity),
            sqrt_ratio_b_x_96 - sqrt_ratio_a_x_96,
            uint!(0x1000000000000000000000000_U256),
        )
    }
}

/// Calculates the delta of token 0 amount between two prices, automatically rounding in the correct
/// direction.
pub fn get_amount_0_delta(
    sqrt_ratio_a_x_96: U256,
    sqrt_ratio_b_x_96: U256,
    liquidity: i128,
) -> Result<I256, Error> {
    if liquidity < 0 {
        Ok(-I256::from_raw(_get_amount_0_delta(
            sqrt_ratio_a_x_96,
            sqrt_ratio_b_x_96,
            -liquidity as u128,
            false,
        )?))
    } else {
        Ok(I256::from_raw(_get_amount_0_delta(
            sqrt_ratio_a_x_96,
            sqrt_ratio_b_x_96,
            liquidity as u128,
            true,
        )?))
    }
}

/// Calculates the delta of token 1 amount between two prices, automatically rounding in the correct
/// direction.
pub fn get_amount_1_delta(
    sqrt_ratio_a_x_96: U256,
    sqrt_ratio_b_x_96: U256,
    liquidity: i128,
) -> Result<I256, Error> {
    if liquidity < 0 {
        Ok(-I256::from_raw(_get_amount_1_delta(
            sqrt_ratio_a_x_96,
            sqrt_ratio_b_x_96,
            -liquidity as u128,
            false,
        )?))
    } else {
        Ok(I256::from_raw(_get_amount_1_delta(
            sqrt_ratio_a_x_96,
            sqrt_ratio_b_x_96,
            liquidity as u128,
            true,
        )?))
    }
}

pub fn get_amounts_for_delta(
    sqrt_ratio_x_96: U256,
    mut sqrt_ratio_a_x_96: U256,
    mut sqrt_ratio_b_x_96: U256,
    liquidity: i128,
) -> Result<(I256, I256), Error> {
    if sqrt_ratio_a_x_96 > sqrt_ratio_b_x_96 {
        (sqrt_ratio_a_x_96, sqrt_ratio_b_x_96) = (sqrt_ratio_b_x_96, sqrt_ratio_a_x_96)
    };
    Ok(if sqrt_ratio_x_96 <= sqrt_ratio_a_x_96 {
        (
            get_amount_0_delta(sqrt_ratio_a_x_96, sqrt_ratio_b_x_96, liquidity)?,
            I256::ZERO,
        )
    } else if sqrt_ratio_x_96 < sqrt_ratio_b_x_96 {
        (
            get_amount_0_delta(sqrt_ratio_x_96, sqrt_ratio_b_x_96, liquidity)?,
            get_amount_1_delta(sqrt_ratio_a_x_96, sqrt_ratio_x_96, liquidity)?,
        )
    } else {
        (
            I256::ZERO,
            get_amount_1_delta(sqrt_ratio_a_x_96, sqrt_ratio_b_x_96, liquidity)?,
        )
    })
}

/// Calculates the liquidity in the form of the delta amount for
/// amount0.
pub fn get_liquidity_for_amount_0(
    mut sqrt_ratio_a_x_96: U256,
    mut sqrt_ratio_b_x_96: U256,
    amount: U256,
) -> Result<u128, Error> {
    if sqrt_ratio_a_x_96 > sqrt_ratio_b_x_96 {
        (sqrt_ratio_a_x_96, sqrt_ratio_b_x_96) = (sqrt_ratio_b_x_96, sqrt_ratio_a_x_96)
    };
    let intermediate = mul_div(sqrt_ratio_a_x_96, sqrt_ratio_b_x_96, Q96)?;
    let res = mul_div(amount, intermediate, sqrt_ratio_b_x_96 - sqrt_ratio_a_x_96)?;
    res.to_u128()
        .map_or_else(|| Err(Error::LiquidityAmountTooWide), Ok)
}

/// Calculates the liquidity in the form of the delta number for amount0. Refer to
/// [get_liquidity_for_amount_0]
pub fn get_liquidity_for_amount_1(
    mut sqrt_ratio_a_x_96: U256,
    mut sqrt_ratio_b_x_96: U256,
    amount: U256,
) -> Result<u128, Error> {
    if sqrt_ratio_a_x_96 > sqrt_ratio_b_x_96 {
        (sqrt_ratio_a_x_96, sqrt_ratio_b_x_96) = (sqrt_ratio_b_x_96, sqrt_ratio_a_x_96)
    };
    let res = mul_div(amount, Q96, sqrt_ratio_b_x_96 - sqrt_ratio_a_x_96)?;
    res.to_u128()
        .map_or_else(|| Err(Error::LiquidityAmountTooWide), Ok)
}

pub fn get_liquidity_for_amounts(
    sqrt_ratio_x_96: U256,
    mut sqrt_ratio_a_x_96: U256,
    mut sqrt_ratio_b_x_96: U256,
    amount_0: U256,
    amount_1: U256,
) -> Result<u128, Error> {
    if sqrt_ratio_a_x_96 > sqrt_ratio_b_x_96 {
        (sqrt_ratio_a_x_96, sqrt_ratio_b_x_96) = (sqrt_ratio_b_x_96, sqrt_ratio_a_x_96)
    };

    let delta = if sqrt_ratio_x_96 <= sqrt_ratio_a_x_96 {
        get_liquidity_for_amount_0(sqrt_ratio_a_x_96, sqrt_ratio_b_x_96, amount_0)?
    } else if sqrt_ratio_x_96 < sqrt_ratio_b_x_96 {
        let liq0 = get_liquidity_for_amount_0(sqrt_ratio_x_96, sqrt_ratio_b_x_96, amount_0)?;
        let liq1 = get_liquidity_for_amount_1(sqrt_ratio_a_x_96, sqrt_ratio_x_96, amount_1)?;
        if liq0 > liq1 {
            liq1
        } else {
            liq0
        }
    } else {
        get_liquidity_for_amount_1(sqrt_ratio_a_x_96, sqrt_ratio_b_x_96, amount_1)?
    };

    Ok(delta)
}

#[cfg(test)]
mod test {
    use std::ops::{Add, Sub};

    use crate::types::{U256Extension, U256};

    use super::*;

    #[test]
    fn test_get_next_sqrt_price_from_input() {
        //Fails if price is zero
        let result = get_next_sqrt_price_from_input(
            U256::zero(),
            0,
            U256::from(100000000000000000_u128),
            false,
        );
        assert_eq!(result.unwrap_err().to_string(), "Sqrt price is 0");

        //Fails if liquidity is zero
        let result = get_next_sqrt_price_from_input(
            U256::one(),
            0,
            U256::from(100000000000000000_u128),
            true,
        );
        assert_eq!(result.unwrap_err().to_string(), "Liquidity is 0");

        //fails if input amount overflows the price
        let result = get_next_sqrt_price_from_input(MAX_U160, 1024, U256::from(1024), false);
        assert_eq!(
            result.unwrap_err().to_string(),
            "Overflow when casting to U160"
        );

        //any input amount cannot underflow the price
        let result = get_next_sqrt_price_from_input(
            U256::one(),
            1,
            U256::from_dec_str(
                "57896044618658097711785492504343953926634992332820282019728792003956564819968",
            )
            .unwrap(),
            true,
        );

        assert_eq!(result.unwrap(), U256::one());

        //returns input price if amount in is zero and zeroForOne = true
        let result = get_next_sqrt_price_from_input(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            1e17 as u128,
            U256::zero(),
            true,
        );

        assert_eq!(
            result.unwrap(),
            U256::from_dec_str("79228162514264337593543950336").unwrap()
        );

        //returns input price if amount in is zero and zeroForOne = false
        let result = get_next_sqrt_price_from_input(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            1e17 as u128,
            U256::zero(),
            true,
        );

        assert_eq!(
            result.unwrap(),
            U256::from_dec_str("79228162514264337593543950336").unwrap()
        );

        //returns the minimum price for max inputs

        let sqrt_price = MAX_U160;
        let liquidity = u128::MAX;
        let max_amount_no_overflow = U256::MAX - ((U256::from(liquidity) << 96) / sqrt_price);
        let result =
            get_next_sqrt_price_from_input(sqrt_price, liquidity, max_amount_no_overflow, true);
        assert_eq!(result.unwrap(), U256::one());

        //input amount of 0.1 token1
        let result = get_next_sqrt_price_from_input(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            1e18 as u128,
            U256::from_dec_str("100000000000000000").unwrap(),
            false,
        );

        assert_eq!(
            result.unwrap(),
            U256::from_dec_str("87150978765690771352898345369").unwrap()
        );

        //input amount of 0.1 token0
        let result = get_next_sqrt_price_from_input(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            1e18 as u128,
            U256::from_dec_str("100000000000000000").unwrap(),
            true,
        );

        assert_eq!(
            result.unwrap(),
            U256::from_dec_str("72025602285694852357767227579").unwrap()
        );

        //amountIn > type(uint96).max and zeroForOne = true
        let result = get_next_sqrt_price_from_input(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            1e19 as u128,
            U256::from_dec_str("1267650600228229401496703205376").unwrap(),
            true,
        );
        // perfect answer:
        // https://www.wolframalpha.com/input/?i=624999999995069620+-+%28%281e19+*+1+%2F+%281e19+%2B+2%5E100+*+1%29%29+*+2%5E96%29
        assert_eq!(
            result.unwrap(),
            U256::from_dec_str("624999999995069620").unwrap()
        );

        //can return 1 with enough amountIn and zeroForOne = true
        let result = get_next_sqrt_price_from_input(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            1,
            U256::MAX / U256::from(2),
            true,
        );

        assert_eq!(result.unwrap(), U256::one());
    }

    #[test]
    fn test_get_next_sqrt_price_from_output() {
        //fails if price is zero
        let result =
            get_next_sqrt_price_from_output(U256::zero(), 0, U256::from(1000000000), false);
        assert_eq!(result.unwrap_err().to_string(), "Sqrt price is 0");

        //fails if liquidity is zero
        let result = get_next_sqrt_price_from_output(U256::one(), 0, U256::from(1000000000), false);
        assert_eq!(result.unwrap_err().to_string(), "Liquidity is 0");

        //fails if output amount is exactly the virtual reserves of token0
        let result = get_next_sqrt_price_from_output(
            U256::from_dec_str("20282409603651670423947251286016").unwrap(),
            1024,
            U256::from(4),
            false,
        );
        assert_eq!(
            result.unwrap_err().to_string(),
            "require((product = amount * sqrtPX96) / amount == sqrtPX96 && numerator1 > product);"
        );

        //fails if output amount is greater than virtual reserves of token0
        let result = get_next_sqrt_price_from_output(
            U256::from_dec_str("20282409603651670423947251286016").unwrap(),
            1024,
            U256::from(5),
            false,
        );
        assert_eq!(
            result.unwrap_err().to_string(),
            "require((product = amount * sqrtPX96) / amount == sqrtPX96 && numerator1 > product);"
        );

        //fails if output amount is greater than virtual reserves of token1
        let result = get_next_sqrt_price_from_output(
            U256::from_dec_str("20282409603651670423947251286016").unwrap(),
            1024,
            U256::from(262145),
            true,
        );
        assert_eq!(
            result.unwrap_err().to_string(),
            "Sqrt price is less than or equal to quotient"
        );

        //fails if output amount is exactly the virtual reserves of token1
        let result = get_next_sqrt_price_from_output(
            U256::from_dec_str("20282409603651670423947251286016").unwrap(),
            1024,
            U256::from(262144),
            true,
        );
        assert_eq!(
            result.unwrap_err().to_string(),
            "Sqrt price is less than or equal to quotient"
        );

        //succeeds if output amount is just less than the virtual
        let result = get_next_sqrt_price_from_output(
            U256::from_dec_str("20282409603651670423947251286016").unwrap(),
            1024,
            U256::from(262143),
            true,
        );
        assert_eq!(
            result.unwrap(),
            U256::from_dec_str("77371252455336267181195264").unwrap()
        );

        //puzzling echidna test
        let result = get_next_sqrt_price_from_output(
            U256::from_dec_str("20282409603651670423947251286016").unwrap(),
            1024,
            U256::from(4),
            false,
        );
        assert_eq!(
            result.unwrap_err().to_string(),
            "require((product = amount * sqrtPX96) / amount == sqrtPX96 && numerator1 > product);"
        );

        //returns input price if amount in is zero and zeroForOne = true
        let result = get_next_sqrt_price_from_output(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            1e17 as u128,
            U256::zero(),
            true,
        );
        assert_eq!(
            result.unwrap(),
            U256::from_dec_str("79228162514264337593543950336").unwrap()
        );

        //returns input price if amount in is zero and zeroForOne = false
        let result = get_next_sqrt_price_from_output(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            1e17 as u128,
            U256::zero(),
            false,
        );
        assert_eq!(
            result.unwrap(),
            U256::from_dec_str("79228162514264337593543950336").unwrap()
        );

        //output amount of 0.1 token1
        let result = get_next_sqrt_price_from_output(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            1e18 as u128,
            U256::from(1e17 as u128),
            false,
        );
        assert_eq!(
            result.unwrap(),
            U256::from_dec_str("88031291682515930659493278152").unwrap()
        );

        //output amount of 0.1 token1
        let result = get_next_sqrt_price_from_output(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            1e18 as u128,
            U256::from(1e17 as u128),
            true,
        );
        assert_eq!(
            result.unwrap(),
            U256::from_dec_str("71305346262837903834189555302").unwrap()
        );

        //reverts if amountOut is impossible in zero for one direction
        let result = get_next_sqrt_price_from_output(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            1,
            U256::MAX,
            true,
        );
        assert_eq!(
            result.unwrap_err().to_string(),
            "Denominator is less than or equal to prod_1"
        );

        //reverts if amountOut is impossible in one for zero direction
        let result = get_next_sqrt_price_from_output(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            1,
            U256::MAX,
            false,
        );
        assert_eq!(
            result.unwrap_err().to_string(),
            "require((product = amount * sqrtPX96) / amount == sqrtPX96 && numerator1 > product);"
        );
    }

    #[test]
    fn test_get_amount_0_delta() {
        // returns 0 if liquidity is 0
        let amount_0 = _get_amount_0_delta(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            0,
            true,
        );

        assert_eq!(amount_0.unwrap(), U256::zero());

        // returns 0 if prices are equal
        let amount_0 = _get_amount_0_delta(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            U256::from_dec_str("87150978765690771352898345369").unwrap(),
            0,
            true,
        );

        assert_eq!(amount_0.unwrap(), U256::zero());

        // returns 0.1 amount1 for price of 1 to 1.21
        let amount_0 = _get_amount_0_delta(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            U256::from_dec_str("87150978765690771352898345369").unwrap(),
            1e18 as u128,
            true,
        )
        .unwrap();

        assert_eq!(
            amount_0.clone(),
            U256::from_dec_str("90909090909090910").unwrap()
        );

        let amount_0_rounded_down = _get_amount_0_delta(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            U256::from_dec_str("87150978765690771352898345369").unwrap(),
            1e18 as u128,
            false,
        );

        assert_eq!(amount_0_rounded_down.unwrap(), amount_0.sub(U256::one()));

        // works for prices that overflow
        let amount_0_up = _get_amount_0_delta(
            U256::from_dec_str("2787593149816327892691964784081045188247552").unwrap(),
            U256::from_dec_str("22300745198530623141535718272648361505980416").unwrap(),
            1e18 as u128,
            true,
        )
        .unwrap();

        let amount_0_down = _get_amount_0_delta(
            U256::from_dec_str("2787593149816327892691964784081045188247552").unwrap(),
            U256::from_dec_str("22300745198530623141535718272648361505980416").unwrap(),
            1e18 as u128,
            false,
        )
        .unwrap();

        assert_eq!(amount_0_up, amount_0_down.add(U256::one()));
    }

    #[test]
    fn test_get_amount_1_delta() {
        // returns 0 if liquidity is 0
        let amount_1 = _get_amount_1_delta(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            0,
            true,
        );

        assert_eq!(amount_1.unwrap(), U256::zero());

        // returns 0 if prices are equal
        let amount_1 = _get_amount_1_delta(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            U256::from_dec_str("87150978765690771352898345369").unwrap(),
            0,
            true,
        );

        assert_eq!(amount_1.unwrap(), U256::zero());

        // returns 0.1 amount1 for price of 1 to 1.21
        let amount_1 = _get_amount_1_delta(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            U256::from_dec_str("87150978765690771352898345369").unwrap(),
            1e18 as u128,
            true,
        )
        .unwrap();

        assert_eq!(
            amount_1.clone(),
            U256::from_dec_str("100000000000000000").unwrap()
        );

        let amount_1_rounded_down = _get_amount_1_delta(
            U256::from_dec_str("79228162514264337593543950336").unwrap(),
            U256::from_dec_str("87150978765690771352898345369").unwrap(),
            1e18 as u128,
            false,
        );

        assert_eq!(amount_1_rounded_down.unwrap(), amount_1.sub(U256::one()));
    }

    #[test]
    fn test_swap_computation() {
        let sqrt_price =
            U256::from_dec_str("1025574284609383690408304870162715216695788925244").unwrap();
        let liquidity = 50015962439936049619261659728067971248;
        let zero_for_one = true;
        let amount_in = U256::from(406);

        let sqrt_q =
            get_next_sqrt_price_from_input(sqrt_price, liquidity, amount_in, zero_for_one).unwrap();

        assert_eq!(
            sqrt_q,
            U256::from_dec_str("1025574284609383582644711336373707553698163132913").unwrap()
        );

        let amount_0_delta = _get_amount_0_delta(sqrt_q, sqrt_price, liquidity, true).unwrap();

        assert_eq!(amount_0_delta, U256::from(406));
    }

    #[test]
    fn test_get_liquidity_for_amount0_spot_tests() {
        // tests reproduced from the Uniswap test suite

        use core::str::FromStr;

        assert_eq!(
            get_liquidity_for_amount_0(
                U256::from_str("79228162514264337593543950336").unwrap(),
                U256::from_str("82974292838386133450542").unwrap(),
                U256::from_str("1506981345970968035").unwrap()
            )
            .unwrap()
            .to_string(),
            U256::from_str("1578237314707").unwrap().to_string()
        );

        assert_eq!(
            get_liquidity_for_amount_0(
                U256::from_str("4295128739").unwrap(),
                U256::from_str("18446744078004680355").unwrap(),
                U256::from_str("18446744073709551616").unwrap()
            )
            .unwrap()
            .to_string(),
            U256::from_str("1").unwrap().to_string()
        );
    }

    #[test]
    fn test_get_liquidity_for_amount_0_spot_rederive() {
        use core::str::FromStr;

        let lower = U256::from_str("4295128739").unwrap();
        let upper = U256::from_str("18446744078004680355").unwrap();
        let liquidity = get_liquidity_for_amount_0(
            lower,
            upper,
            U256::from_str("18446744073709551616").unwrap(),
        )
        .unwrap();
        let amount = _get_amount_0_delta(lower, upper, liquidity, false).unwrap();
        assert_eq!(amount.to_string(), "18446050703072278768".to_owned());
    }

    #[test]
    fn test_get_liquidity_for_amount1_spot_tests() {
        // tests reproduced from the Uniswap test suite
        use core::str::FromStr;

        assert_eq!(
            get_liquidity_for_amount_1(
                U256::from_limbs([4294805859, 0, 0, 0]), //4294805859
                U256::from_limbs([4294805859, 1, 0, 0]), //18446744078004357475
                U256::from_limbs([1, 2147483648, 0, 0])  //39614081257132168796771975169
            )
            .unwrap()
            .to_string(),
            U256::from_str("170141183460469231731687303720179073024")
                .unwrap()
                .to_string()
        );
    }

    #[test]
    fn test_get_liquidity_for_amount0_table() {
        // TODO: make easier to use
        #[rustfmt::skip]
        let args = [
            ("9876416927236102004188340379", "10737229136272366293555469388", "837", "1301", "836"),
            ("9787744123590526679853713079", "71284224322527327499287032247", "766", "109", "761"),
            ("60319826552146216696883871362", "60268799725849324628754509377", "410", "368687", "409"),
            ("3124973761668296364266242575", "3120343280785912796040456412", "436", "11588", "435"),
            ("20090456232393719941793176963", "58351648602516949737339937228", "798", "308", "796"),
            ("68384654835795907180976004310", "34605748905088410543624705140", "784", "693", "783"),
            ("57779003239014807112964391525", "23152931952922393465126766409", "443", "216", "442"),
            ("49566642677555590828677392843", "18353183926775314421634573344", "784", "288", "782"),
            ("26332240142764038028738633305", "24317700236808976333462561004", "373", "1496", "372"),
            ("24771360138108093693697542676", "30119086644510582302329373661", "986", "1736", "985"),
            ("28735070346162700288720146053", "36550349829736556819828509003", "784", "1329", "783"),
            ("60421246697511142780174832038", "30055732054475255960517614926", "796", "600", "794"),
            ("32651377875585734561344886148", "25260907062356967672199145093", "62", "87", "61"),
            ("36347468836257781755811107330", "132285450725363310660223539", "201", "0", "0"),
            ("33882763149337352012777869958", "30505507799909982868768935503", "538", "2078", "537"),
            ("27383091847066800852849437107", "67982332066714323247465474553", "510", "295", "509"),
            ("79004673253654632058527626826", "41182851229862784574666731739", "327", "355", "326"),
            ("67920749362250821003080738253", "11317047019568013118136662551", "282", "48", "280"),
            ("44826753410549187758830223245", "6408111204924149366999561515", "970", "91", "964"),
            ("17065713095316888017373554927", "44638751829542000353451037561", "380", "132", "378"),
            ("36563184407931042871663741440", "68134195521766688933987925510", "277", "275", "276"),
            ("54868688698822536328908644332", "75296139593872044190090989119", "514", "1312", "513"),
            ("34152081238132504185229786530", "29202649309224752260575110759", "404", "1027", "403"),
            ("75035871818881718437354804737", "47378705974634053331268229610", "881", "1429", "880"),
            ("69643849754125599228100763950", "25202661949198214744157887791", "605", "301", "603"),
            ("49372696248922906419386775542", "62089298133806559823202807996", "74", "225", "73"),
            ("20340462258342378653291467829", "72131753623214697765052516804", "474", "169", "472"),
            ("51211922327463483382460323433", "45565471203739645068856972771", "887", "4626", "886"),
            ("72582891518198662133685784759", "45551417032098330869945001715", "889", "1372", "888"),
            ("17507236750218362993433890", "34070769484832994436870921372", "838", "0", "0"),
            ("43101106865932296710654893884", "51782601623323714265887151540", "262", "850", "261"),
            ("68494952751519492379161285320", "64780140690374342443774901725", "662", "9980", "661"),
            ("61693038375197154054322693952", "10229896082255200369073590972", "970", "150", "969"),
            ("49522219106032979490152689151", "50805909733419216663907499249", "725", "17935", "724"),
            ("57849106386831682879175233648", "28876494044379296070788095219", "339", "246", "338"),
            ("14857715976695020461013883548", "36219492052275844208175764280", "341", "108", "339"),
            ("18248680760434985885845429794", "61791726351961904245584175268", "405", "132", "403"),
            ("76908934730688690218400782155", "2179694778748826942589626315", "86", "2", "70"),
            ("36913630655443161385984727961", "76389716021584232093434503091", "223", "201", "222"),
            ("10477535354613352796825186891", "45709543238299935700969296017", "120", "20", "116"),
            ("79224688085377744527477675321", "4867991550226998359589762858", "262", "17", "259"),
            ("73870595035605117263641901587", "50936278362178978392424152534", "14", "28", "13"),
            ("61463592781690965295329725858", "37764719841904978483287825765", "390", "482", "389"),
            ("72555799598235077260128617717", "53192169874832760383400491033", "97", "244", "96"),
            ("14870093872021976353757807255", "47865108905407573725039082435", "488", "132", "484"),
            ("23125768691599194758545321251", "10851777608033463019148006222", "405", "104", "402"),
            ("28852448485297600591366603397", "38303933641147520251251692053", "488", "720", "487"),
            ("75879277178236520693937810806", "16681600868845576652912892099", "139", "37", "137"),
            ("61634857871052333515430653885", "68703784560439864071430731256", "465", "3515", "464"),
            ("38015992444709607095082609576", "73431525079808774134917933204", "610", "606", "609"),
            ("36157480302991904234745982171", "61415513837936394162324588914", "195", "216", "194"),
            ("35389856076730604875436004757", "64272961134144824884342020598", "401", "398", "400"),
            ("4381102467394224682768662554", "53442061143944165830686298420", "899", "54", "896"),
            ("31758097908423228873106560174", "50052163865660385346678436754", "84", "92", "83"),
            ("8763164089611223759443735244", "60098564994926626036753094328", "323", "41", "316"),
            ("23038011211698267642011802938", "79173799807691462243699396417", "885", "362", "882"),
            ("77516475085929406797318107114", "55457466769781265518353540905", "960", "2361", "959"),
            ("75797334021103378371655779937", "31403087186255303529250268566", "368", "249", "367"),
            ("29724013510162943001733730678", "49061572466179828363970998629", "199", "189", "198"),
            ("64939612643908312293000024982", "20231796992994716504382766836", "38", "14", "37"),
            ("38371649705898460848088370760", "30786610583922430659293470616", "533", "1047", "532"),
            ("3985453928430791944483664905", "18175700186472507777180927488", "8", "0", "0"),
            ("33294274722500679124190690260", "67582841102863136227131323755", "861", "713", "860"),
            ("71089544133611136797822740967", "76413802846121611308260924438", "205", "2639", "204"),
            ("77873416881410648443223695998", "18578655267807955902201260052", "568", "174", "564"),
            ("60755189124093892556595514872", "42602099033664293583806000533", "324", "583", "323"),
            ("43832099887953040665371238982", "62625184478794812239286062672", "842", "1552", "841"),
            ("27085972166433880062315686136", "32954475379958168006665845635", "418", "802", "417"),
            ("67799010413761200079667106063", "78509847861145363614275918945", "802", "5030", "801"),
            ("56000442198005380424486429095", "16858527916867968368076723091", "131", "39", "128"),
            ("17802802559167271840538816900", "76257455106587224691477546075", "388", "113", "385"),
            ("37638246817422585080616475650", "75335492129344297728386364960", "495", "469", "494"),
            ("77098301892241088448337659656", "34867405966557323705763017863", "170", "136", "169"),
            ("18624744461723422183187896476", "18016041327831432645495643927", "301", "2094", "300"),
            ("14205924097842677832139337750", "58743404142145107008907023070", "510", "120", "507"),
            ("7585324151265570112279792984", "28961720528974145690728811796", "291", "37", "285"),
            ("48959819324461117702633840467", "38161061459371504701421101274", "725", "1583", "724"),
            ("27250654051356903478849922200", "76896343627978327234030836295", "634", "337", "632"),
            ("36029879961602946640818305816", "64620039686427240194930151001", "675", "693", "674"),
            ("74451428889151483378265507390", "55143730107224782725673571244", "954", "2560", "953"),
            ("65491184728081711445940664242", "55042211171268506749696958878", "277", "1206", "276"),
            ("30178511925108571559499457446", "76829779164880530440078437553", "715", "448", "714"),
            ("57770148994002221546532583093", "19166256707882680936196012795", "668", "241", "665"),
            ("72800134999356257360428393153", "31416986177649251616722158238", "479", "334", "478"),
            ("69865875981630188377568352479", "11805097195132211431303714920", "884", "158", "881"),
            ("59338204424903842676875914177", "59770220305849953343980817403", "301", "31189", "300"),
            ("40469772437752851757268527557", "54672380124884391660325886332", "539", "1059", "538"),
            ("19764484988732952758971937217", "48665467670555153491734872456", "525", "220", "523"),
            ("20722838353624083183330842981", "21741836674747915001986874515", "243", "1356", "242"),
            ("46937195332299017407373989448", "17513867688706961059709773140", "786", "277", "785"),
            ("26124918367155825840160348251", "2796964805264646925174373545", "921", "36", "910"),
            ("76844310026117946766417205714", "14816796413371531089174292412", "712", "164", "707"),
            ("25130516670137028211158688658", "44112291717434341766514879131", "261", "192", "260"),
            ("23654379527857771799976005750", "76890136994281027228058979052", "65", "28", "64"),
            ("79112877801315996054556722156", "72156134280758357276467978685", "137", "1418", "136"),
            ("5494315455101240755385018121", "14597389718587716769358402350", "413", "45", "404"),
            ("69260825715697786031039750517", "73727664961918941996862448724", "711", "10259", "710"),
            ("6445933647722243295614633482", "35916797848333387046187097738", "614", "60", "605"),
            ("15828306181280897694922371071", "9537199152674246090784494161", "217", "65", "214"),
            ("35901584117191111673958095498", "1231089104383855437026141357", "942", "15", "932"),
            ("70261695373186788316743542010", "42824913116438303286842855666", "311", "430", "310"),
            ("42742685611581311720552058493", "9600352241706531306761383212", "101", "15", "95"),
            ("66086848259388635611536722169", "75060554865654346435905335706", "162", "1130", "161"),
            ("55822373305117660544323556988", "72335978096245564021830700923", "160", "493", "159"),
            ("3949928801089422470282623972", "62291059325366777413202024601", "869", "46", "864"),
            ("63937338937199086881289145946", "59410129369314962446518356233", "55", "582", "54"),
            ("42229529700945275435869275441", "27124227588214238372152587859", "660", "631", "659"),
            ("4051858587630403864185592773", "7592880457430326100804532382", "764", "83", "756"),
            ("62800400790798591313362034356", "59429978546706004414634432427", "768", "10734", "767"),
            ("29498346466632120396363720704", "50949481692764409906357437524", "779", "688", "778"),
            ("35990824481818358478214997237", "41315888112315779208894820461", "80", "281", "79"),
            ("68450856581006170729216319345", "10867812954638003433644391774", "205", "33", "202"),
            ("30817071841494743755971391542", "51870103510392789030772595879", "272", "260", "271"),
            ("6182698558644290447988298078", "13606361104559931174406368318", "961", "137", "957"),
            ("60206970252730752701570011032", "30761349718503215213617692177", "864", "685", "862"),
            ("69975563561092549433482341697", "38721305825156742187722157205", "986", "1078", "985"),
            ("4832333467135332616262717694", "52099521257146754597644724626", "163", "10", "148"),
            ("58921013796829930457168358383", "76183713634782016611131092986", "132", "433", "131"),
            ("25547494605635519028180003096", "1330875984423230876508173243", "990", "17", "959"),
            ("18770230693924512788844542202", "30906346369917027557749024489", "455", "274", "454"),
            ("36109695859195090877228758595", "14508941294154436930301425050", "393", "120", "391"),
            ("78616320684117585496516354384", "27147807316098530642053958225", "111", "58", "110"),
            ("31838036004092960623481882865", "9881318250430112842789413579", "80", "14", "77"),
            ("13593479191400781631108217968", "60168014792018134776703951998", "460", "101", "455"),
            ("9576920628408817757425346619", "75558082578297851275326168714", "596", "82", "592"),
            ("73120709475583815980541297545", "43323971492748803023036510073", "206", "276", "205"),
            ("67044772812023025038324254258", "65554812658602566345787061416", "718", "26732", "717"),
            ("70326696235928290211538238851", "29875996368630284393476450527", "736", "482", "735"),
            ("76106183793409666234976169115", "1818774861394394782093483372", "511", "12", "510"),
            ("73756698959797914911561415794", "36543747617077046973493886502", "332", "303", "331"),
            ("29547262059710481983799821822", "4356649765776126384444183341", "866", "55", "852"),
            ("41407095093131485335092041610", "72619874277778517986517653948", "286", "347", "285"),
            ("74296878078799345991060344620", "66153069317006952509596394390", "105", "799", "104"),
            ("16979116573399175134613831337", "1219983802122468467603612157", "943", "15", "904"),
            ("42058411911893207123575070882", "51233926450926731830469655324", "381", "1129", "380"),
            ("53201845039437877635604805105", "2029822991504034043748085801", "292", "7", "262"),
            ("79168714077654826096273640588", "40819497687162460398408078662", "96", "102", "95"),
            ("8904159694681933155443265477", "65027320536247823459410334327", "334", "43", "330"),
            ("4437639988920705866945614141", "71352753396322108880914990849", "282", "16", "267"),
            ("77467019313455822789958952347", "66257241641798069474831946322", "869", "5022", "868"),
            ("42309017135558895686551920919", "31847783723224920184008333078", "84", "136", "83"),
            ("3166505226389856901685596535", "21559859681800267396542247278", "413", "19", "405"),
            ("30545221885914490186229915969", "15477438718859384449526870673", "401", "158", "398"),
            ("9792653650107547661034630209", "2314024140709801128154652196", "472", "18", "470"),
        ];
        use core::str::FromStr;
        for (lower, upper, amount, delta_expected, amount_expected) in args {
            let lower = U256::from_str(lower).unwrap();
            let upper = U256::from_str(upper).unwrap();
            let amount_used = U256::from_str(amount).unwrap();
            let delta = get_liquidity_for_amount_0(lower, upper, amount_used).unwrap();
            let amount = _get_amount_0_delta(lower, upper, delta, false).unwrap();
            assert!(
                delta.to_string() == delta_expected && amount.to_string() == amount_expected,
                "divergence in results, delta args [{lower}, {upper}, {amount}], amount args [{lower}, {upper}, {delta}], delta expected {delta_expected}, delta was {delta}, amount expected {amount_expected}, amount was {amount}",
            );
        }
    }

    #[test]
    fn test_get_liquidity_for_amount1_table() {
        // TODO: make easier to use
        #[rustfmt::skip]
        let args = [
            ("9876416927236102004188340379", "10737229136272366293555469388", "837", "77036", "836"),
            ("9787744123590526679853713079", "71284224322527327499287032247", "766", "986", "765"),
            ("60319826552146216696883871362", "60268799725849324628754509377", "410", "636597", "409"),
            ("3124973761668296364266242575", "3120343280785912796040456412", "436", "7460019", "435"),
            ("33498267507122301099894646268", "40234032253704854315540768048", "357", "4199", "356"),
            ("38023128188741097077955895654", "9198172844912118709821740680", "120", "329", "119"),
            ("62754508765365259648060640608", "67163454170248024084451488075", "448", "8050", "447"),
            ("2156859963483825882805008879", "78627420345245116444321335615", "667", "691", "666"),
            ("22108937938521525410178601188", "49411177965731041136604436564", "811", "2353", "810"),
            ("8719713742395246631546613848", "61462881882685447952286556864", "81", "121", "80"),
            ("69563262504748424399323032681", "17853144808556136263549317924", "864", "1323", "863"),
            ("50459778435066372879493756451", "60960562958274444649842471078", "964", "7273", "963"),
            ("4319561796366828729357631470", "15714658986045934928259350968", "505", "3511", "504"),
            ("28659110031904695636844706458", "51936424490865816215979400914", "308", "1048", "307"),
            ("37888522817675664507280177438", "4486579916739438202312483803", "646", "1532", "645"),
            ("75573219297913683758058908790", "40826945918112689871278300346", "887", "2022", "886"),
            ("70934446382101281241564771205", "42460702754923188673793721861", "821", "2284", "820"),
            ("5837490121956273336478725317", "26015058479126032431821724686", "399", "1566", "398"),
            ("14406310813593564179907239518", "35167093070002290084913573622", "860", "3281", "859"),
            ("525388884798929020792786862", "72022913796148040412527590047", "893", "989", "892"),
            ("14346588669521734423674698489", "9053400082289838290856477120", "123", "1841", "122"),
            ("57508044914236860759984859241", "29592565117203179396021322955", "259", "735", "258"),
            ("69131681639338612846160761573", "64680287543170784610735019095", "111", "1975", "110"),
            ("10570491481989961151011800492", "69954063421340563454934038686", "813", "1084", "812"),
            ("16338800241901608355438331488", "17120634820237814874461890186", "649", "65767", "648"),
            ("64258391430822597331281450452", "41933584680131918314254091160", "876", "3108", "875"),
            ("28812432680157227947919563738", "48938495876523659629546671543", "305", "1200", "304"),
            ("35401294433311113058347054397", "32716383028352626225181517767", "886", "26144", "885"),
            ("39938889048463195952085562812", "9902110201622870582662946665", "662", "1746", "661"),
            ("26294697318382854520618522925", "51106883895458665567000887210", "116", "370", "115"),
            ("51432593486297841736510638836", "34453371383388185546719514355", "637", "2972", "636"),
            ("72261457282544624221823101652", "64026296127934544566298280822", "687", "6609", "686"),
            ("69267076556262417624361827583", "38359558714258393477260295815", "258", "661", "257"),
            ("70449925047689006838944323845", "13025477983582527150930979381", "410", "565", "409"),
            ("48324542241472950966195212195", "75827265227791299625558918409", "448", "1290", "447"),
            ("26350413470781218108384263285", "72726711308328178769209316689", "493", "842", "492"),
            ("7003222923088518496927241662", "7056844107758036707234847720", "450", "664899", "449"),
            ("76830821710573455968411624905", "49659299124668698367665599617", "250", "728", "249"),
            ("40721702197082944858985277833", "61099413228846779352388802533", "854", "3320", "853"),
            ("62307688300995041851976470340", "38155622916212505520579221920", "239", "784", "238"),
            ("3424140446043256011598018637", "46666638287297167203575777912", "713", "1306", "712"),
            ("29378153726567843513996837905", "51126177094805290585417679266", "458", "1668", "457"),
            ("61784614431111943939861684937", "47448468597120988381848706471", "773", "4271", "772"),
            ("51861834190190433525522838612", "41340912948719069007571333413", "98", "737", "97"),
            ("9079567339183949485811752234", "39192944910774904345458087512", "357", "939", "356"),
            ("33483878082389610743352765189", "25987038123327066687354815801", "149", "1574", "148"),
            ("12285667556330668009186783625", "8555057026621539321547097338", "290", "6158", "289"),
            ("9567129060041668500010601266", "21279498077034393107373303929", "371", "2509", "370"),
            ("2244443579523780380704377711", "6062671997272227957591093330", "271", "5623", "270"),
            ("48891140463697792582223269052", "76073098851050563122177068645", "702", "2046", "701"),
            ("9544396041289155201688826573", "31487116217801323619257913677", "134", "483", "133"),
            ("27741673570191527635232593585", "67939132793700670997700020552", "93", "183", "92"),
            ("64755314419445869136110849985", "69701272942807690648973833183", "471", "7544", "470"),
            ("72445037512825020074556773585", "11774222884663167254800525639", "235", "306", "234"),
            ("76804080989899497539779350073", "322702269524321022410487194", "793", "821", "792"),
            ("37948312747778609558056387247", "28918778435154262940039813718", "380", "3334", "379"),
            ("39927138469119793732039174259", "74708630922463101264087880570", "895", "2038", "894"),
            ("6763913107823557346324094664", "76744105041783503928700945973", "988", "1118", "987"),
            ("73008491525552373912987885215", "41284928982196219597377755724", "875", "2185", "874"),
            ("64011811251085320226822469921", "41537633164327530805608197543", "984", "3468", "983"),
            ("22868542647591890354588684213", "31021841016987459058973579625", "477", "4635", "476"),
            ("75560779886376393631084736277", "63363600643582295189763777836", "89", "578", "88"),
            ("38410174027778850536267084009", "4835447250796750122094640393", "353", "832", "352"),
            ("15182164103164715294650080102", "22713207646771397493616069504", "613", "6448", "612"),
            ("58033877065375128597914120829", "23396479760712510655863328741", "144", "329", "143"),
            ("30792388503866510697356119954", "36769337219019122414169827314", "936", "12407", "935"),
            ("23453970611061571601769619826", "61164053338554719602840992384", "570", "1197", "569"),
            ("57117621862616629037630090036", "26047511510043158002217065698", "963", "2455", "962"),
            ("21707209582701366839390710763", "2659483618668966467957377531", "151", "628", "150"),
            ("17999367157205167562620287665", "56288809591236916371642348524", "187", "386", "186"),
            ("46425094696952230437539185793", "66345008385138210307118294958", "80", "318", "79"),
            ("36554569310566080049991579589", "78201203606547450545651407533", "165", "313", "164"),
            ("25618094313151275652105503889", "16931991845120128171041875709", "930", "8482", "929"),
            ("75624774615519899134314828522", "38344131742499148497244785087", "862", "1831", "861"),
            ("54575351286101555836470823959", "67098742776241096117904828144", "909", "5750", "908"),
            ("15214735166700926431728679360", "31900777035722068651037751178", "599", "2844", "598"),
            ("32000540335735158410525024390", "12254561523540787306640030160", "324", "1300", "323"),
            ("77682230682933897236498769872", "50509487378178904198054905318", "225", "656", "224"),
            ("63941197843278407260038301404", "75753105464920170644949251860", "467", "3132", "466"),
            ("45322909301320788401141028868", "27850667818865362887464554176", "850", "3854", "849"),
            ("65053136398467903336232472901", "78506190452692586730025914205", "950", "5594", "949"),
            ("22585851049021384911454231452", "45396595247698536688377591844", "724", "2514", "723"),
            ("2025981048269232733172982058", "57426632863953703232019982947", "212", "303", "211"),
            ("19994435533409559395873746015", "74139226073877004143644195029", "808", "1182", "807"),
            ("18835735986775908823526822086", "2266788637127047898225120618", "286", "1367", "285"),
            ("55209675743797666725579086743", "16490399562214402486238215136", "790", "1616", "789"),
            ("57759178442999563107547400810", "2901171196015690854230473942", "82", "118", "81"),
            ("13136104398115672480063633595", "4885990883304591007424758838", "0", "0", "0"),
            ("68515717462379246847481580056", "1840432506146768009915673686", "510", "606", "509"),
            ("42404635091213992446426394673", "8276524304574449174197730703", "711", "1650", "710"),
            ("50369057928806480134143406552", "31512526890117410938882421850", "411", "1726", "410"),
            ("36500423707531039194478939795", "72909252829900345503603820636", "722", "1571", "721"),
            ("10656709122606082852136755681", "46360323704322882181703571203", "859", "1906", "858"),
            ("46210986025575815793213883555", "69382974076938612174882284973", "40", "136", "39"),
            ("24194587032493496637605342498", "20919432257340659128704125734", "656", "15869", "655"),
            ("9532045690571739318190871754", "7980878375425091204501955852", "2", "102", "1"),
            ("20652779647717364542352130173", "75381235927798837654255429838", "76", "110", "75"),
            ("35491045593910086482869700695", "38170095769295787787115518215", "388", "11474", "387"),
            ("40711383348050671594937077220", "13282685327202138444919474213", "387", "1117", "386"),
            ("43835633762300810284717024856", "2824574738147936115513877755", "309", "596", "308"),
            ("59147458449470152242358956345", "49920804594886511606334908803", "562", "4825", "561"),
            ("65088564869097207947622337517", "9845937730320658269954912801", "755", "1082", "754"),
            ("51437534642663586426154187017", "70094289433311763521739498951", "820", "3482", "819"),
            ("48782351990659102492780836822", "32208373932513307292160827651", "554", "2648", "553"),
            ("19576820413319496941542543505", "26354761945229099849906253137", "416", "4862", "415"),
            ("26647550265954303871867892328", "65848044715869915297302917105", "643", "1299", "642"),
            ("53175405319933489863391816753", "68836993777660193439434095219", "190", "961", "189"),
            ("40085879755776520660654642766", "68269514259035800478798717924", "332", "933", "331"),
            ("27041833333454388106560828212", "28374890581208463412900368587", "339", "20147", "338"),
            ("39644869606834591542370757600", "4078419652330394906906571237", "675", "1503", "674"),
            ("25388594965704224427507104460", "60127291622694609678406972190", "878", "2002", "877"),
            ("56293012066714515323126978936", "41148186488816429461236723830", "404", "2113", "403"),
            ("36632060553950016593055031085", "3344168923609327459348688645", "967", "2301", "966"),
            ("41901547477932495136989578114", "47147635702851883662528187506", "357", "5391", "356"),
            ("12068073396424426873912461706", "23725715483640307943434734954", "388", "2636", "387"),
            ("57056936524623954842742551871", "38573906204712024693803955656", "905", "3879", "904"),
            ("47423108850873466536915077803", "65927909776969741549340629117", "772", "3305", "771"),
            ("37889622370849136215840328386", "40004998582464451863188358803", "682", "25543", "681"),
            ("38180774716717957888697216352", "221332560683671498446444148", "841", "1755", "840"),
            ("74080595674166817796562940129", "59954779675022874875484081365", "334", "1873", "333"),
            ("58727930808595514625248102166", "29338095642210363952968316155", "954", "2571", "953"),
            ("14241010912070466560083544485", "70771372582033719858046605514", "194", "271", "193"),
            ("38904852887534112050889844416", "34136538391371598246245423000", "695", "11547", "694"),
            ("15466170019852693067842898829", "31566085120555799043161936758", "422", "2076", "421"),
            ("29985103910252012235216382639", "16697702013069022751954697758", "946", "5640", "945"),
            ("19532528753936209022221376590", "5510884698985033960661541431", "886", "5006", "885"),
            ("68144185835764048681476808467", "60850622627173537938622249031", "333", "3617", "332"),
            ("60175991546697373556075393148", "51300256101663216765377312", "474", "624", "473"),
            ("11949834754523002999197267632", "12697120239989369879466704028", "433", "45907", "432"),
            ("35347944453589956632549995976", "35644833875204288218528768285", "766", "204415", "765"),
            ("45250068318261487207715667297", "73214284257821245550641341121", "504", "1427", "503"),
            ("9336213299879160978620965515", "70179606080725145250322944870", "676", "880", "675"),
            ("13011343558670770457630860779", "3811480377692656439460131603", "825", "7104", "824"),
            ("14091438738899120646348346752", "75695906132900420382473214149", "604", "776", "603"),
            ("76921262510936240530075283028", "2409398782128677686977942174", "852", "905", "851"),
            ("34945145333948383908090309278", "22037799336755755269764930649", "493", "3026", "492"),
            ("73648578341617429590895588838", "47539129592022826928703260996", "405", "1228", "404"),
            ("29170502769329944571643106457", "50092357057411696238224747218", "234", "886", "233"),
            ("58353529926672855568465609701", "10899850133314722893570034496", "282", "470", "281"),
            ("12915711593872445028112817952", "3770715150345169238203612174", "85", "736", "84"),
            ("70712497462002228487639368566", "20684613093093643621998699991", "117", "185", "116"),
            ("59504441533925600362195865837", "16877424986528026297644485848", "364", "676", "363"),
            ("30146175535151432111268519000", "65057981560978096230428645430", "810", "1838", "809"),
            ("965638345264650359433471945", "40877871054319822748904366699", "870", "1727", "869"),
            ("68004299585116931489255939187", "19495497177893496993104074438", "979", "1598", "978"),
            ("63392148654626109745682641213", "53802640447492826347875602588", "669", "5527", "668"),
            ("69737553411708327287279131203", "56441168836697744574659822570", "632", "3765", "631"),
            ("50468190747429975401388491625", "35168963225300365609712697673", "926", "4795", "925"),
            ("67031740137058515513970290834", "76666926518897540885956138237", "716", "5887", "715"),
            ("17547951565823796844877926410", "51570526580021495043420194021", "854", "1988", "853"),
            ("7145145497129821927863190560", "51531155249362902691778988284", "603", "1076", "602"),
            ("72497173634649639159762908777", "41993407654788446235069725520", "469", "1218", "468"),
            ("36609996360381242260548789553", "37413573574594157520157320571", "76", "7493", "75"),
            ("2074055189856902468543267294", "42536245258011047483710543610", "380", "744", "379"),
            ("16904804431424692178227488763", "41839231906285884783720644526", "323", "1026", "322"),
            ("47475734274022723527744797500", "58729327594255144882607312308", "399", "2809", "398"),
            ("44743741391860736078459491127", "69104925269713287022683140048", "648", "2107", "647"),
            ("54506982059217197500068393649", "53161278946968547021343852304", "585", "34441", "584"),
            ("55482449401095102100107375031", "281393145926610338863943537", "594", "852", "593"),
            ("33456045079284179053195779813", "20079087855298110496199593622", "105", "621", "104"),
            ("56495425452632749937466412821", "3375402350129057649033879695", "12", "17", "11"),
            ("71069730486165604979040559068", "48827726023844491855419943100", "534", "1902", "533"),
            ("54070026118403932736853028175", "55242485649073989870742651311", "744", "50275", "743"),
            ("14354252065936639192282222756", "6182026677118224398329579766", "641", "6214", "640"),
            ("6292593816366187356566917503", "75806341480063391225217676821", "316", "360", "315"),
            ("72836193651678540813745147203", "50002453956413736082452858932", "908", "3150", "907"),
            ("12294723125971986163019922432", "3872236784501089977648561311", "307", "2887", "306"),
            ("16675633165844742191538839191", "56069573200291745885092933811", "436", "876", "435"),
            ("49258844960794710020460105491", "39741669486173251815823002756", "987", "8216", "986"),
            ("46758332603525163282576498470", "1555503552621415322782013133", "756", "1325", "755"),
            ("54999412525915426763865265377", "59469494612125639453981267806", "201", "3562", "200"),
            ("51365748537878744458601084480", "9445366345335827958246857527", "236", "446", "235"),
            ("74072638468926609902339160076", "7497931294157753055681701339", "672", "799", "671"),
            ("39288995468366388475619336260", "64811309668137219950010806965", "371", "1151", "370"),
            ("18148826272499636265855045321", "63159635083979659011465175909", "191", "336", "190"),
            ("47571322770906722603235070697", "4949948943706481997606433097", "942", "1751", "941"),
            ("39564684443369132468618350085", "44743481476953168726203196957", "214", "3273", "213"),
            ("41233333471889712816235112294", "12843074441946751304229333075", "357", "996", "356"),
            ("14549125752355090188965678103", "78140833956209394517447010321", "745", "928", "744"),
            ("33338922270795477765615453626", "73981659421314350861185865679", "552", "1076", "551"),
            ("14761362265830307078001906070", "56298188128375822834864226890", "202", "385", "201"),
            ("34052010329644938414444715455", "1788396336685384334965330472", "806", "1979", "805"),
            ("38522300988477945419003108383", "39884054150086622399093252906", "79", "4596", "78"),
            ("66067610474235608057291300937", "78581738635859632940444024544", "891", "5641", "890"),
            ("63465456248541516649784794073", "35084371507963386030468575150", "31", "86", "30"),
            ("76262879010409222353050438174", "46712561397923760607948297292", "569", "1525", "568"),
            ("14822650823119593733171373505", "66767657368288778736081685100", "841", "1282", "840"),
            ("28179416373553935062058649329", "49856726750439416503846750338", "24", "87", "23"),
            ("62630955823852067930631139396", "33609198622623863423815480537", "472", "1288", "471"),
            ("27668736905864566052067665849", "34442640297470928567442327858", "213", "2491", "212"),
            ("1217139203269492140894353042", "36596603467484956267530841366", "62", "138", "61"),
            ("23201093602983902006979541730", "34757077831551473125000569625", "115", "788", "114"),
            ("49831020169028761913802169284", "53513289040472461464554718290", "748", "16094", "747"),
            ("20289863146388083564515305189", "23293768503414290495018074036", "622", "16405", "621"),
            ("23607797835839367858053171592", "28739661015072561769962757635", "538", "8305", "537"),
            ("64120981931444300670415335175", "40740085151053613715259569129", "221", "748", "220"),
            ("30584313340117316779483337460", "27505188446330150217583492715", "750", "19298", "749"),
            ("35635927980140107995447691987", "63765151551034791535275672711", "765", "2154", "764"),
            ("68907596449317151713840413623", "52049897357029831165537795703", "955", "4488", "954"),
            ("38303872911500115524077168692", "52939738202924813038580854056", "901", "4877", "900"),
            ("22592794220559853566339086300", "57378863392067061683691845379", "983", "2238", "982"),
            ("73074496093316599733222340113", "6872590490220523637686315987", "529", "633", "528"),
            ("20127516196179441347528776636", "20854945911017748302951122762", "696", "75804", "695"),
            ("32686501384985562507360726547", "3734591608615761066646728114", "163", "446", "162"),
            ("59423493568355641106318915584", "67704010802538077827674358929", "512", "4898", "511"),
            ("22306333463889426671413419108", "32316757086948836861555377796", "481", "3806", "480"),
            ("35053423626232918129615225151", "56015237247868083377018644347", "999", "3775", "998"),
            ("15771052371421963721315231082", "27275090451542366963937770336", "564", "3884", "563"),
            ("38218768851687975601309058957", "24135108109017819308404237722", "726", "4084", "725"),
            ("31139870638377914885320169145", "49256111227454534789712976725", "656", "2868", "655"),
            ("42296741320105296707939655843", "72885493406984992140809609366", "798", "2066", "797"),
            ("1224798167147314993809867597", "72734907790328719605960225189", "532", "589", "531"),
            ("267038176021419315363754014", "31090076430776372110267052239", "16", "41", "15"),
            ("67098211020616655287253849415", "36337142206763996944888440646", "254", "654", "253"),
            ("7679555475399122842894969575", "50498688179056480614883894525", "272", "503", "271"),
            ("8718099086694199651955971067", "29843167051229923633976667235", "430", "1612", "429"),
            ("20468739876013522018565996194", "30482180652218155333959157172", "442", "3497", "441"),
            ("9581060814691200569725488523", "24982427621022619085895062875", "22", "113", "21"),
            ("26735200474247210902547668307", "36833311926374940109059194555", "494", "3875", "493"),
            ("68471372301534147758318133675", "9899414715701504298351243336", "950", "1285", "949"),
            ("16459859599448919682444328137", "27596376517340997119365245342", "671", "4773", "670"),
            ("5816993811632481327701539006", "61936166837367120015136077515", "113", "159", "112"),
            ("34637937682607589737088471127", "22323731645524349520334953121", "497", "3197", "496"),
            ("61246521413345638521401702047", "15200372303206770970246562308", "354", "609", "353"),
            ("48241729034475097857737847925", "20591468003174791187962101547", "360", "1031", "359"),
            ("19863586125782642655899655975", "78663303497454432790920377805", "274", "369", "273"),
            ("1309978408657552320460207914", "57677378398728190908218358390", "635", "892", "634"),
            ("6576220454871229774866093314", "75477765019574933501336065492", "423", "486", "422"),
            ("32274046658965988169838397358", "66271362295739204606650845706", "835", "1945", "834"),
            ("51364167117720319032692217708", "3726079738361448741490333820", "590", "981", "589"),
            ("58855840404929075255521169883", "12860574636957621947911462988", "190", "327", "189"),
            ("56660565696521956804401003962", "39608491323304369057913208215", "729", "3387", "728"),
            ("7647664559949973175598623650", "48411869947811974368272197317", "744", "1446", "743"),
            ("24064911113853620961314517156", "69225562626164521068554068755", "186", "326", "185"),
            ("61795405534660571192857441800", "69602292350421270870548189007", "932", "9458", "931"),
            ("39903573441716233001892391641", "26112185594916372088881999977", "566", "3251", "565"),
            ("47960948299203029826496379933", "32664305614024484729929034881", "698", "3615", "697"),
            ("33063934559231671490152270327", "25317405509730899653665022771", "841", "8601", "840"),
            ("4388397867858118579521208893", "100984924636208627001876171", "731", "13508", "730"),
            ("11731860901529829045647135930", "45335210546550452355305324170", "883", "2081", "882"),
            ("36928183408589380796367649294", "62753756584246349686416371150", "953", "2923", "952"),
            ("20577659666028923634495325858", "20186195794425431118706345100", "384", "77717", "383"),
            ("3792170299286697430145353095", "4686010354535836990912251669", "192", "17018", "191"),
            ("3664040793603976247918508797", "2057338015087729662253794820", "267", "13166", "266"),
            ("64269818417727966945093159326", "65989639335379220925847293949", "356", "16400", "355"),
            ("68662044793047344105679370204", "78687439792550150674751509809", "748", "5911", "747"),
            ("25897190029141138600042123154", "61596281884548065431434008744", "186", "412", "185"),
            ("39954947084917890674876430240", "28503767026203237424500370559", "203", "1404", "202"),
            ("51640153515028291075083973802", "52725491910053877836623967143", "142", "10365", "141"),
            ("11549232693906874173296603735", "35546481686954149484157181745", "583", "1924", "582"),
            ("4299320841276418137587631983", "62667347563060591369387268972", "893", "1212", "892"),
            ("46719002748674448660814821111", "76141086090697058726845697342", "40", "107", "39"),
            ("45520670336654203074315134552", "11924614346936681671000334735", "830", "1957", "829"),
            ("43672415142422627931497542730", "76880618274528548439077592525", "452", "1078", "451"),
            ("44058059287120683368955103931", "50489865447654872749560041573", "964", "11874", "963"),
            ("35769119713518422084433009279", "18414533005064516992816925987", "404", "1844", "403"),
            ("29256859307905851175199834953", "23147255175568485606454705245", "837", "10854", "836"),
            ("11238466091154262458154596160", "66952460334918202293399107344", "683", "971", "682"),
            ("66491380276593471133446760986", "14042124402346929161684070887", "462", "697", "461"),
            ("39438346922732542956329617327", "59057051252407066057082125607", "28", "113", "27"),
        ];
        use core::str::FromStr;
        for (lower, upper, amount, delta_expected, amount_expected) in args {
            let lower = U256::from_str(lower).unwrap();
            let upper = U256::from_str(upper).unwrap();
            let amount_used = U256::from_str(amount).unwrap();
            let delta = get_liquidity_for_amount_1(lower, upper, amount_used).unwrap();
            let amount = _get_amount_1_delta(lower, upper, delta, false).unwrap();
            assert!(
                delta.to_string() == delta_expected && amount.to_string() == amount_expected,
                "divergence in results, delta args [{lower}, {upper}, {amount}], amount args [{lower}, {upper}, {delta}], delta expected {delta_expected}, delta was {delta}, amount expected {amount_expected}, amount was {amount}",
            );
        }
    }

    #[test]
    fn test_get_liquidity_for_amounts() {
        //751912010970822292130506636887
        let sqrt_ratio_x_96 = U256::from_limbs([11538413573761564247, 40761231790, 0, 0]);
        //560222498985353939371108591955
        let sqrt_ratio_a_x_96 = U256::from_limbs([14000197498442344787, 30369722523, 0, 0]);
        //970301221836460185987766484855
        let sqrt_ratio_b_x_96 = U256::from_limbs([396151174394216311, 52600134634, 0, 0]);
        let amount_0 = U256::from(10000000);
        let amount_1 = U256::from(10000000);
        let expected_delta = 4133150_u128;

        let delta = get_liquidity_for_amounts(
            sqrt_ratio_x_96,
            sqrt_ratio_a_x_96,
            sqrt_ratio_b_x_96,
            amount_0,
            amount_1,
        )
        .unwrap();

        assert_eq!(delta, expected_delta);
    }
}

#[cfg(test)]
mod test_properties {
    use super::*;
    use proptest::prelude::*;

    const MIN_PRICE_WORD: u64 = 4295128739;
    const MAX_PRICE_WORD: u64 = 17280870778742802505;

    proptest! {
        #[test]
        fn test_get_liquidity_for_amount0(
            sqrt_price_a_x_96_1 in MIN_PRICE_WORD..MAX_PRICE_WORD,
            sqrt_price_a_x_96_2 in 0..MIN_PRICE_WORD,
            sqrt_price_b_x_96_1 in MIN_PRICE_WORD..MAX_PRICE_WORD,
            sqrt_price_b_x_96_2 in 0..MIN_PRICE_WORD,
            amount in 0..1e30 as i128
        ) {
            // test if the liquidity for amount0 works, by calculating the liquidity,
            // then reversing it to get amount0.

            let sqrt_ratio_a_x_96 = U256::from_limbs([sqrt_price_a_x_96_1, sqrt_price_a_x_96_2, 0, 0]);
            let sqrt_ratio_b_x_96 = U256::from_limbs([sqrt_price_b_x_96_1, sqrt_price_b_x_96_2, 0, 0]);

            let amount_expected = U256::from(amount);

            if sqrt_ratio_a_x_96 == sqrt_ratio_b_x_96 {
                return Ok(());
            }

            let liquidity_ = get_liquidity_for_amount_0(sqrt_ratio_a_x_96, sqrt_ratio_b_x_96, amount_expected);
            prop_assert!(
                liquidity_.is_ok(),
                "failed to unpack liquidity amount1, args {}, {}, {}",
                sqrt_ratio_a_x_96,
                sqrt_ratio_b_x_96,
                amount_expected
            );

            let liquidity_ = liquidity_.unwrap();
            let liquidity = liquidity_.to_u128();
            prop_assert!(
                liquidity.is_some(),
                "failed to convert liquidity amount1 to uint128 {}, args {}, {}, {}",
                liquidity_,
                sqrt_ratio_a_x_96,
                sqrt_ratio_b_x_96,
                amount_expected
            );

            let liquidity = liquidity.unwrap();

            let amount_result = _get_amount_0_delta(sqrt_ratio_a_x_96, sqrt_ratio_b_x_96, liquidity, false);
            prop_assert!(
                amount_result.is_ok(),
                "_get_amount_0_delta returned {:?}, args {}, {}, {}, {}",
                amount_result.err(),
                sqrt_ratio_a_x_96,
                sqrt_ratio_b_x_96,
                liquidity,
                false
            );
            let amount_result = amount_result.unwrap();

            #[cfg(feature = "testing-dbg")]
            dbg!((
                sqrt_ratio_a_x_96.to_string(),
                sqrt_ratio_b_x_96.to_string(),
                amount_expected.to_string(),
                liquidity.to_string(),
                amount_result.to_string()
            ));

            // in practice, the amount that might be requested is below the amount
            // that's possible to derive again. so we need to check if this goes
            // above the number, and reproduce elsewhere.

            prop_assert!(
                amount_result <= amount_expected,
                "liquidity {}, args {}, {}, {}: return {}",
                liquidity,
                sqrt_ratio_a_x_96.to_string(),
                sqrt_ratio_b_x_96.to_string(),
                amount_expected.to_string(),
                amount_result
            );
        }

        #[test]
        fn test_get_liquidity_for_amount1(
            sqrt_price_a_x_96_1 in MIN_PRICE_WORD..MAX_PRICE_WORD,
            sqrt_price_a_x_96_2 in 0..MIN_PRICE_WORD,
            sqrt_price_b_x_96_1 in MIN_PRICE_WORD..MAX_PRICE_WORD,
            sqrt_price_b_x_96_2 in 0..MIN_PRICE_WORD,
            amount in 0..1e3 as i128
        ) {
            // test if the liquidity for amount1 works, by calculating the liquidity,
            // then reversing it to get amount1.

            let sqrt_ratio_a_x_96 = U256::from_limbs([sqrt_price_a_x_96_1, sqrt_price_a_x_96_2, 0, 0]);
            let sqrt_ratio_b_x_96 = U256::from_limbs([sqrt_price_b_x_96_1, sqrt_price_b_x_96_2, 0, 0]);

            let amount_expected = U256::from(amount);

            if sqrt_ratio_a_x_96 == sqrt_ratio_b_x_96 {
                return Ok(());
            }

            let liquidity_ = get_liquidity_for_amount_1(sqrt_ratio_a_x_96, sqrt_ratio_b_x_96, amount_expected);
            prop_assert!(
                liquidity_.is_ok(),
                "failed to call liquidity amount1, args {}, {}, {}",
                sqrt_ratio_a_x_96,
                sqrt_ratio_b_x_96,
                amount_expected
            );

            let liquidity = liquidity_.unwrap();

            let amount_result = _get_amount_1_delta(sqrt_ratio_a_x_96, sqrt_ratio_b_x_96, liquidity, false);

            prop_assert!(
                amount_result.is_ok(),
                "_get_amount_1_delta returned {:?}, args {}, {}, {}, {}",
                amount_result.err(),
                sqrt_ratio_a_x_96,
                sqrt_ratio_b_x_96,
                liquidity,
                false
            );

            let amount_result = amount_result.unwrap();

            #[cfg(feature = "testing-dbg")]
            dbg!((
                sqrt_ratio_a_x_96.to_string(),
                sqrt_ratio_b_x_96.to_string(),
                amount_expected.to_string(),
                liquidity.to_string(),
                amount_result.to_string()
            ));

            prop_assert!(
                amount_result <= amount_expected,
                "liquidity {}, args {}, {}, {}: return {}",
                liquidity,
                sqrt_ratio_a_x_96.to_string(),
                sqrt_ratio_b_x_96.to_string(),
                amount_expected.to_string(),
                amount_result
            );
        }
    }
}
