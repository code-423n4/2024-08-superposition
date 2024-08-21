//! Functions for operating on ticks.

use crate::types::{U256Extension, U256};

use crate::error::Error;
use ruint_macro::uint;

/// The lowest tick still representible.
pub const MIN_TICK: i32 = -887272;
/// The highest tick still representible.
pub const MAX_TICK: i32 = -MIN_TICK;

// The lowest X96 encoded square root price still representable.
pub const MIN_SQRT_RATIO: U256 = U256::from_limbs([4295128739, 0, 0, 0]);
// The highest X96 encoded square root price still representable.
pub const MAX_SQRT_RATIO: U256 =
    U256::from_limbs([6743328256752651558, 17280870778742802505, 4294805859, 0]);

/// Calculates the X96 encoded square root price for a given tick index.
pub fn get_sqrt_ratio_at_tick(tick: i32) -> Result<U256, Error> {
    let mut abs_tick = tick.abs();

    if abs_tick > MAX_TICK {
        return Err(Error::T);
    }

    // calculate (1/1.0001)^(i/2)
    // = (1/1.0001)^(floor(i/2)) * maybe (1/1.0001)^(0.5)

    let mut result = if (abs_tick & 0x1) != 0 {
        uint!(0xfffcb933bd6fad37aa2d162d1a594001_U256) // 1 * (1/1.0001)^0.5
    } else {
        U256::one() << 128 // 1
    };

    abs_tick >>= 1;

    let mut ratio = uint!(0xfff97272373d413259a46990580e213a_U256); // 1/1.0001

    while abs_tick != 0 {
        if (abs_tick & 1) != 0 {
            result = (result * ratio) >> 128;
        }
        ratio = (ratio * ratio) >> 128;
        abs_tick >>= 1;
    }

    // invert back from 1/1.0001^i to 1.0001^i
    if tick > 0 {
        result = U256::MAX / result;
    }

    Ok((result >> 32)
        + if (result % (U256::one() << 32) as U256).is_zero() {
            U256::zero()
        } else {
            U256::one()
        })
}

/// Calculates tick index for a given X96 encoded square root price.
pub fn get_tick_at_sqrt_ratio(sqrt_price_x_96: U256) -> Result<i32, Error> {
    if !(sqrt_price_x_96 >= MIN_SQRT_RATIO && sqrt_price_x_96 < MAX_SQRT_RATIO) {
        return Err(Error::R);
    }

    // binary search
    let mut low_bound = MIN_TICK;
    let mut high_bound = MAX_TICK;

    let mut closest = low_bound;
    while low_bound <= high_bound {
        let mid = (low_bound + high_bound) / 2;
        let mid_price = get_sqrt_ratio_at_tick(mid)?;

        if mid_price > sqrt_price_x_96 {
            high_bound = mid - 1;
        }
        if mid_price < sqrt_price_x_96 {
            closest = mid;
            low_bound = mid + 1;
        }
        if mid_price == sqrt_price_x_96 {
            return Ok(mid);
        }
    }

    Ok(closest)
}

/// Calculates the smallest tick index given a tick spacing.
pub fn get_min_tick(spacing: u8) -> i32 {
    let spacing = spacing as i32;
    (MIN_TICK / spacing) * spacing
}

/// Calculates the greatest tick index given a tick spacing.
pub fn get_max_tick(spacing: u8) -> i32 {
    let spacing = spacing as i32;
    (MAX_TICK / spacing) * spacing
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::types::U256;
    use std::ops::Sub;

    #[test]
    fn get_sqrt_ratio_at_tick_bounds() {
        // the function should return an error if the tick is out of bounds
        if let Err(err) = get_sqrt_ratio_at_tick(MIN_TICK - 1) {
            assert!(matches!(err, Error::T));
        } else {
            panic!("get_qrt_ratio_at_tick did not respect lower tick bound")
        }
        if let Err(err) = get_sqrt_ratio_at_tick(MAX_TICK + 1) {
            assert!(matches!(err, Error::T));
        } else {
            panic!("get_qrt_ratio_at_tick did not respect upper tick bound")
        }
    }

    #[test]
    fn get_sqrt_ratio_at_tick_values() {
        // test individual values for correct results
        assert_eq!(
            get_sqrt_ratio_at_tick(MIN_TICK).unwrap(),
            U256::from(4295128739u64),
            "sqrt ratio at min incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(MIN_TICK + 1).unwrap(),
            U256::from(4295343490u64),
            "sqrt ratio at min + 1 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(MAX_TICK - 1).unwrap(),
            U256::from_dec_str("1461373636630004318706518188784493106690254656249").unwrap(),
            "sqrt ratio at max - 1 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(MAX_TICK).unwrap(),
            U256::from_dec_str("1461446703485210103287273052203988822378723970342").unwrap(),
            "sqrt ratio at max incorrect"
        );
        // checking hard coded values against solidity results
        assert_eq!(
            get_sqrt_ratio_at_tick(50).unwrap(),
            U256::from(79426470787362580746886972461u128),
            "sqrt ratio at 50 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(100).unwrap(),
            U256::from(79625275426524748796330556128u128),
            "sqrt ratio at 100 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(250).unwrap(),
            U256::from(80224679980005306637834519095u128),
            "sqrt ratio at 250 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(500).unwrap(),
            U256::from(81233731461783161732293370115u128),
            "sqrt ratio at 500 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(1000).unwrap(),
            U256::from(83290069058676223003182343270u128),
            "sqrt ratio at 1000 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(2500).unwrap(),
            U256::from(89776708723587163891445672585u128),
            "sqrt ratio at 2500 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(3000).unwrap(),
            U256::from(92049301871182272007977902845u128),
            "sqrt ratio at 3000 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(4000).unwrap(),
            U256::from(96768528593268422080558758223u128),
            "sqrt ratio at 4000 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(5000).unwrap(),
            U256::from(101729702841318637793976746270u128),
            "sqrt ratio at 5000 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(50000).unwrap(),
            U256::from(965075977353221155028623082916u128),
            "sqrt ratio at 50000 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(150000).unwrap(),
            U256::from(143194173941309278083010301478497u128),
            "sqrt ratio at 150000 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(250000).unwrap(),
            U256::from(21246587762933397357449903968194344u128),
            "sqrt ratio at 250000 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(500000).unwrap(),
            U256::from_dec_str("5697689776495288729098254600827762987878").unwrap(),
            "sqrt ratio at 500000 incorrect"
        );
        assert_eq!(
            get_sqrt_ratio_at_tick(738203).unwrap(),
            U256::from_dec_str("847134979253254120489401328389043031315994541").unwrap(),
            "sqrt ratio at 738203 incorrect"
        );
    }

    #[test]
    pub fn test_get_tick_at_sqrt_ratio() {
        //throws for too low
        let result = get_tick_at_sqrt_ratio(MIN_SQRT_RATIO.sub(U256::one()));
        assert_eq!(result.unwrap_err().to_string(), "Second inequality must be < because the price can never reach the price at the max tick");

        //throws for too high
        let result = get_tick_at_sqrt_ratio(MAX_SQRT_RATIO);
        assert_eq!(result.unwrap_err().to_string(), "Second inequality must be < because the price can never reach the price at the max tick");

        //ratio of min tick
        let result = get_tick_at_sqrt_ratio(MIN_SQRT_RATIO).unwrap();
        assert_eq!(result, MIN_TICK);

        //ratio of min tick + 1
        let result = get_tick_at_sqrt_ratio(U256::from_dec_str("4295343490").unwrap()).unwrap();
        assert_eq!(result, MIN_TICK + 1);
    }
}
