use libseawater::types::{U256Extension, U256};
use std::ops::{Add, BitAnd, BitOrAssign, BitXor, Div, Mul, MulAssign};

use libseawater::{
    error::Error,
    maths::utils::{RUINT_ONE, RUINT_THREE, RUINT_TWO, RUINT_ZERO},
};

// returns (uint256 result)
pub fn mul_div(a: U256, b: U256, mut denominator: U256) -> Result<U256, Error> {
    // 512-bit multiply [prod1 prod0] = a * b
    // Compute the product mod 2**256 and mod 2**256 - 1
    // then use the Chinese Remainder Theorem to reconstruct
    // the 512 bit result. The result is stored in two 256
    // variables such that product = prod1 * 2**256 + prod0
    let mm = a.mul_mod(b, U256::MAX);

    let mut prod_0 = a.overflowing_mul(b).0; // Least significant 256 bits of the product
    let mut prod_1 = mm
        .overflowing_sub(prod_0)
        .0
        .overflowing_sub(U256::from((mm < prod_0) as u8))
        .0;

    // Handle non-overflow cases, 256 by 256 division
    if prod_1 == U256::ZERO {
        if denominator == U256::ZERO {
            return Err(Error::DenominatorIsZero);
        }
        return Ok(U256::from_limbs(*prod_0.div(denominator).as_limbs()));
    }

    // Make sure the result is less than 2**256.
    // Also prevents denominator == 0
    if denominator <= prod_1 {
        return Err(Error::DenominatorIsLteProdOne);
    }

    ///////////////////////////////////////////////
    // 512 by 256 division.
    ///////////////////////////////////////////////
    //

    // Make division exact by subtracting the remainder from [prod1 prod0]
    // Compute remainder using mulmod
    let remainder = a.mul_mod(b, denominator);

    // Subtract 256 bit number from 512 bit number
    prod_1 = prod_1
        .overflowing_sub(U256::from((remainder > prod_0) as u8))
        .0;
    prod_0 = prod_0.overflowing_sub(remainder).0;

    // Factor powers of two out of denominator
    // Compute largest power of two divisor of denominator.
    // Always >= 1.
    let mut twos = U256::ZERO
        .overflowing_sub(denominator)
        .0
        .bitand(denominator);

    // Divide denominator by power of two

    denominator = denominator.wrapping_div(twos);

    // Divide [prod1 prod0] by the factors of two
    prod_0 = prod_0.wrapping_div(twos);

    // Shift in bits from prod1 into prod0. For this we need
    // to flip `twos` such that it is 2**256 / twos.
    // If twos is zero, then it becomes one

    twos = (RUINT_ZERO.overflowing_sub(twos).0.wrapping_div(twos)).add(RUINT_ONE);

    prod_0.bitor_assign(prod_1 * twos);

    // Invert denominator mod 2**256
    // Now that denominator is an odd number, it has an inverse
    // modulo 2**256 such that denominator * inv = 1 mod 2**256.
    // Compute the inverse by starting with a seed that is correct
    // for four bits. That is, denominator * inv = 1 mod 2**4

    let mut inv = RUINT_THREE.mul(denominator).bitxor(RUINT_TWO);

    // Now use Newton-Raphson iteration to improve the precision.
    // Thanks to Hensel's lifting lemma, this also works in modular
    // arithmetic, doubling the correct bits in each step.

    inv.mul_assign(RUINT_TWO - denominator * inv); // inverse mod 2**8
    inv.mul_assign(RUINT_TWO - denominator * inv); // inverse mod 2**16
    inv.mul_assign(RUINT_TWO - denominator * inv); // inverse mod 2**32
    inv.mul_assign(RUINT_TWO - denominator * inv); // inverse mod 2**64
    inv.mul_assign(RUINT_TWO - denominator * inv); // inverse mod 2**128
    inv.mul_assign(RUINT_TWO - denominator * inv); // inverse mod 2**256

    // Because the division is now exact we can divide by multiplying
    // with the modular inverse of denominator. This will give us the
    // correct result modulo 2**256. Since the preconditions guarantee
    // that the outcome is less than 2**256, this is the final result.
    // We don't need to compute the high bits of the result and prod1
    // is no longer required.

    Ok(U256::from_le_slice((prod_0 * inv).as_le_slice()))
}

pub fn mul_div_rounding_up(a: U256, b: U256, denominator: U256) -> Result<U256, Error> {
    let result = mul_div(a, b, denominator)?;

    let a = a;
    let b = b;
    let denominator = denominator;

    if a.mul_mod(b, denominator) > RUINT_ZERO {
        if result == U256::MAX {
            Err(Error::ResultIsU256MAX)
        } else {
            Ok(result + U256::one())
        }
    } else {
        Ok(result)
    }
}
