// rng based tests of rewritten functions against their reference implementations

use std::cmp::max;
use std::cmp::min;

use rand::prelude::*;
mod reference;
use libseawater::maths::{full_math, tick_math};
use ruint::aliases::U256;
use ruint::uint;

#[allow(unused_imports)]
use libseawater::current_test;

fn rand_u256<R: Rng + ?Sized>(rng: &mut R) -> U256 {
    U256::from_limbs([rng.gen(), rng.gen(), rng.gen(), rng.gen()])
}

#[test]
fn test_mul_div() {
    let mut rng = rand::thread_rng();
    let mut errs: i64 = 0;
    for _ in 0..1000 {
        let a = rand_u256(&mut rng);
        let b = rand_u256(&mut rng);
        let denom = rand_u256(&mut rng);

        #[cfg(feature = "testing-dbg")]
        dbg!(("mul div", current_test!(), a, b, denom));

        let res = full_math::mul_div(a, b, denom);
        let reference = reference::full_math::mul_div(a, b, denom);
        if res.is_err() {
            errs += 1;
        }
        assert!((res.is_err() && reference.is_err()) || (res.unwrap() == reference.unwrap()),);

        let res = full_math::mul_div_rounding_up(a, b, denom);
        let reference = reference::full_math::mul_div_rounding_up(a, b, denom);
        assert!((res.is_err() && reference.is_err()) || (res.unwrap() == reference.unwrap()),);
    }
    // make sure that we're actually testing the function
    assert!(errs < 500);
}

#[test]
fn test_get_tick_at_sqrt_ratio() {
    let mut rng = rand::thread_rng();
    let mut errs: i64 = 0;
    for _ in 0..1000 {
        let ratio = U256::from_limbs([
            rng.gen_range(4295128739..=6743328256752651558),
            rng.gen_range(0..=17280870778742802505),
            rng.gen_range(0..=4294805859),
            0,
        ]);

        #[cfg(feature = "testing-dbg")]
        dbg!(("ratio", current_test!(), ratio));

        let tick = tick_math::get_tick_at_sqrt_ratio(ratio);
        let reference = reference::tick_math::get_tick_at_sqrt_ratio(ratio);
        if tick.is_err() {
            errs += 1;
        }
        assert!((tick.is_err() && reference.is_err()) || (tick.unwrap() == reference.unwrap()));
    }
    // make sure that we're actually testing the function
    assert!(errs < 10);
}

#[test]
fn test_get_sqrt_ratio_at_tick() {
    const ONE_HUNDRETH_BPS: U256 = uint!(0x10c6f7a0b5ed8d36b4c7f3493858_U256);

    let mut rng = rand::thread_rng();
    let mut errs: i64 = 0;
    for _ in 0..1000 {
        let tick = rng.gen_range(tick_math::MIN_TICK..=tick_math::MAX_TICK);

        let ratio = tick_math::get_sqrt_ratio_at_tick(tick);

        #[cfg(feature = "testing-dbg")]
        dbg!(
            ("tick", current_test!(), tick),
            ("ratio", current_test!(), &ratio)
        );

        let reference = reference::tick_math::get_sqrt_ratio_at_tick(tick);
        if ratio.is_err() {
            errs += 1;
            assert!(ratio.is_err() && reference.is_err());
        } else {
            let ratio = ratio.unwrap();
            let reference = reference.unwrap();
            let abs_diff = max(ratio, reference) - min(ratio, reference);
            // uniswap allows for an error of less than 1/100 bps
            assert!(abs_diff < ONE_HUNDRETH_BPS);
        }
    }
    // make sure that we're actually testing the function
    assert!(errs < 10);
}

mod test_mul_div_more {
    use crate::reference;

    use proptest::prelude::*;

    use libseawater::{
        maths::{full_math, sqrt_price_math::Q96},
        types::U256,
    };

    proptest! {
        #[test]
        fn test_proptest_muldiv(
            a_1 in any::<u64>(),
            a_2 in any::<u64>(),
            b_1 in any::<u64>(),
            b_2 in any::<u64>(),
        ) {
            let a = U256::from_limbs([a_1, a_2, 0, 0]);
            let b = U256::from_limbs([b_1, b_2, 0, 0]);

            let prod = a.checked_mul(b).unwrap();

            // assuming rounding down
            let (expected, _) = prod.div_rem(Q96);
            let expected = expected.to_string();

            let reference_res = reference::full_math::mul_div(a, b, Q96).unwrap().to_string();
            assert_eq!(reference_res, expected);

            let ours_res = full_math::mul_div(a, b, Q96).unwrap().to_string();
            assert_eq!(ours_res, expected);

            #[cfg(feature = "testing-dbg")]
            dbg!((
                "test_proptest_muldiv",
                a.to_string(),
                b.to_string(),
                prod.to_string(),
                expected,
                reference_res,
                ours_res
            ));
        }
    }
}
