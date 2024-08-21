//! 512-bit maths operations.

use crate::types::{U256Extension, U256};

use crate::error::Error;

/// 2^128, for normalising 128-bit fixed point numbers.
pub const Q128: U256 = U256::from_limbs([0, 0, 1, 0]);

/// Returns `a * b % c` without losing precision.
///
/// This function is modified from 0xKitsune's implementation, since we can simply allocate a
/// 512 bit int and do the maths directly on it.
pub fn mul_mod(a: U256, b: U256, mut modulus: U256) -> U256 {
    if modulus == U256::ZERO {
        return U256::ZERO;
    }

    // alloc a 512 bit result
    let mut product = [0; 8];
    let overflow = ruint::algorithms::addmul(&mut product, a.as_limbs(), b.as_limbs());
    debug_assert!(!overflow);

    // compute modulus
    // SAFETY - ruint code
    unsafe { ruint::algorithms::div(&mut product, modulus.as_limbs_mut()) };

    modulus
}

/// Returns `a * b / c` and if the result had carry.
pub fn _mul_div(a: U256, b: U256, mut denom_and_rem: U256) -> Result<(U256, bool), Error> {
    if denom_and_rem == U256::ZERO {
        return Err(Error::DenominatorIsZero);
    }

    let mut mul_and_quo = a.widening_mul::<256, 4, 512, 8>(b);

    unsafe {
        ruint::algorithms::div(mul_and_quo.as_limbs_mut(), denom_and_rem.as_limbs_mut());
    }

    let limbs = mul_and_quo.into_limbs();
    if limbs[4..] != [0_u64; 4] {
        return Err(Error::DenominatorIsLteProdOne);
    }

    let has_carry = denom_and_rem != U256::ZERO;

    Ok((U256::from_limbs_slice(&limbs[0..4]), has_carry))
}

/// Returns `a * b / c`, rounding down.
pub fn mul_div(a: U256, b: U256, denom: U256) -> Result<U256, Error> {
    Ok(_mul_div(a, b, denom)?.0)
}

/// Returns `a * b / c`, rounding up.
pub fn mul_div_rounding_up(a: U256, b: U256, denominator: U256) -> Result<U256, Error> {
    let (result, rem) = _mul_div(a, b, denominator)?;

    if rem {
        if result == U256::MAX {
            Err(Error::ResultIsU256MAX)
        } else {
            Ok(result + U256::one())
        }
    } else {
        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::U256;

    const Q128: U256 = U256::from_limbs([0, 0, 1, 0]);

    #[test]
    fn test_mul_div() {
        //Revert if the denominator is zero
        let result = mul_div(Q128, U256::from(5), U256::zero());
        assert_eq!(result.err().unwrap().to_string(), "Denominator is 0");

        // Revert if the denominator is zero and numerator overflows
        let result = mul_div(Q128, Q128, U256::one());
        assert_eq!(
            result.err().unwrap().to_string(),
            "Denominator is less than or equal to prod_1"
        );

        // Revert if the output overflows uint256
        let result = mul_div(Q128, Q128, U256::one());
        assert_eq!(
            result.err().unwrap().to_string(),
            "Denominator is less than or equal to prod_1"
        );
    }
}

#[cfg(test)]
mod test {
    use std::ops::{Div, Mul, Sub};

    use crate::types::{U256Extension, U256};

    use super::mul_div;

    const Q128: U256 = U256::from_limbs([0, 0, 1, 0]);

    #[test]
    fn test_mul_div() {
        //Revert if the denominator is zero
        let result = mul_div(Q128, U256::from(5), U256::zero());
        assert_eq!(result.err().unwrap().to_string(), "Denominator is 0");

        // Revert if the denominator is zero and numerator overflows
        let result = mul_div(Q128, Q128, U256::one());
        assert_eq!(
            result.err().unwrap().to_string(),
            "Denominator is less than or equal to prod_1"
        );

        // Revert if the output overflows uint256
        let result = mul_div(Q128, Q128, U256::one());
        assert_eq!(
            result.err().unwrap().to_string(),
            "Denominator is less than or equal to prod_1"
        );

        // Reverts on overflow with all max inputs
        let result = mul_div(U256::MAX, U256::MAX, U256::MAX.sub(U256::one()));
        assert_eq!(
            result.err().unwrap().to_string(),
            "Denominator is less than or equal to prod_1"
        );

        // All max inputs
        let result = mul_div(U256::MAX, U256::MAX, U256::MAX);
        assert_eq!(result.unwrap(), U256::MAX);

        // Accurate without phantom overflow
        let result = mul_div(
            Q128,
            U256::from(50).mul(Q128).div(U256::from(100)),
            U256::from(150).mul(Q128).div(U256::from(100)),
        );
        assert_eq!(result.unwrap(), Q128.div(U256::from(3)));

        // Accurate with phantom overflow
        let result = mul_div(Q128, U256::from(35).mul(Q128), U256::from(8).mul(Q128));
        assert_eq!(
            result.unwrap(),
            U256::from(4375).mul(Q128).div(U256::from(1000))
        );

        // Accurate with phantom overflow and repeating decimal
        let result = mul_div(Q128, U256::from(1000).mul(Q128), U256::from(3000).mul(Q128));
        assert_eq!(result.unwrap(), Q128.div(U256::from(3)));
    }
}
