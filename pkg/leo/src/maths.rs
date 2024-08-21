use stylus_sdk::alloy_primitives::U256;

/// Returns `a * b / c` and if the result had carry. Copied from Seawater and Result
/// removed.
pub fn _mul_div(a: U256, b: U256, mut denom_and_rem: U256) -> U256 {
    assert!(!denom_and_rem.is_zero());

    let mut mul_and_quo = a.widening_mul::<256, 4, 512, 8>(b);

    unsafe {
        ruint::algorithms::div(mul_and_quo.as_limbs_mut(), denom_and_rem.as_limbs_mut());
    }

    let limbs = mul_and_quo.into_limbs();
    assert!(limbs[4..] == [0_u64; 4]);

    let has_carry = denom_and_rem != U256::ZERO;

    U256::from_limbs_slice(&limbs[0..4])
}

pub fn calc_base_rewards(pool_lp: U256, our_lp: U256, rewards_per_sec: U256) -> U256 {
    _mul_div(pool_lp, rewards_per_sec, our_lp)
}
