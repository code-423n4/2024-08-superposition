use libseawater::error::Error;
use libseawater::maths::tick_math::*;
use libseawater::types::{U256Extension, I256, U256};
use ruint_macro::uint;
use std::ops::{BitOr, Neg, Shl, Shr};

pub fn get_tick_at_sqrt_ratio(sqrt_price_x_96: U256) -> Result<i32, Error> {
    if !(sqrt_price_x_96 >= MIN_SQRT_RATIO && sqrt_price_x_96 < MAX_SQRT_RATIO) {
        return Err(Error::R);
    }

    let ratio: U256 = sqrt_price_x_96.shl(32);
    let mut r = ratio;
    let mut msb = U256::zero();

    let mut f = if r > uint!(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF_U256) {
        U256::one().shl(7)
    } else {
        U256::zero()
    };
    msb = msb.bitor(f);
    r = r.shr(usize::try_from(f).unwrap());

    f = if r > uint!(0xFFFFFFFFFFFFFFFF_U256) {
        U256::one().shl(6)
    } else {
        U256::zero()
    };
    msb = msb.bitor(f);
    r = r.shr(usize::try_from(f).unwrap());

    f = if r > uint!(0xFFFFFFFF_U256) {
        U256::one().shl(5)
    } else {
        U256::zero()
    };
    msb = msb.bitor(f);
    r = r.shr(usize::try_from(f).unwrap());

    f = if r > uint!(0xFFFF_U256) {
        U256::one().shl(4)
    } else {
        U256::zero()
    };
    msb = msb.bitor(f);
    r = r.shr(usize::try_from(f).unwrap());

    f = if r > uint!(0xFF_U256) {
        U256::one().shl(3)
    } else {
        U256::zero()
    };
    msb = msb.bitor(f);
    r = r.shr(usize::try_from(f).unwrap());

    f = if r > uint!(0xF_U256) {
        U256::one().shl(2)
    } else {
        U256::zero()
    };
    msb = msb.bitor(f);
    r = r.shr(usize::try_from(f).unwrap());

    f = if r > uint!(0x3_U256) {
        U256::one().shl(1)
    } else {
        U256::zero()
    };
    msb = msb.bitor(f);
    r = r.shr(usize::try_from(f).unwrap());

    f = if r > uint!(0x1_U256) {
        U256::one()
    } else {
        U256::zero()
    };

    msb = msb.bitor(f);

    r = if msb >= U256::from(128) {
        ratio.shr(usize::try_from(msb - U256::from(127)).unwrap())
    } else {
        ratio.shl(usize::try_from(U256::from(127) - msb).unwrap())
    };

    let mut log_2: I256 = (I256::from_raw(msb) - I256::unchecked_from(128)).shl(64);

    for i in (51..=63).rev() {
        r = r.overflowing_mul(r).0.shr(127);
        let f: U256 = r.shr(128);
        log_2 = log_2.bitor(I256::from_raw(f.shl(i)));

        r = r.shr(usize::try_from(f).unwrap());
    }

    r = r.overflowing_mul(r).0.shr(127);
    let f: U256 = r.shr(128);
    log_2 = log_2.bitor(I256::from_raw(f.shl(50)));

    let log_sqrt10001 = log_2.wrapping_mul(I256::from_raw(uint!(255738958999603826347141_U256)));

    let tick_low = ((log_sqrt10001
        - I256::from_raw(uint!(3402992956809132418596140100660247210_U256)))
        >> 128_u8)
        .low_i32();

    let tick_high = ((log_sqrt10001
        + I256::from_raw(uint!(291339464771989622907027621153398088495_U256)))
        >> 128_u8)
        .low_i32();

    let tick = if tick_low == tick_high {
        tick_low
    } else if get_sqrt_ratio_at_tick(tick_high)? <= sqrt_price_x_96 {
        tick_high
    } else {
        tick_low
    };

    Ok(tick)
}

pub fn get_sqrt_ratio_at_tick(tick: i32) -> Result<U256, Error> {
    let abs_tick = if tick < 0 {
        U256::from(tick.neg())
    } else {
        U256::from(tick)
    };

    if abs_tick > U256::from(MAX_TICK) {
        return Err(Error::T);
    }

    let mut ratio = if abs_tick & (U256::from(0x1)) != U256::zero() {
        uint!(0xfffcb933bd6fad37aa2d162d1a594001_U256)
    } else {
        uint!(0x100000000000000000000000000000000_U256)
    };

    if !(abs_tick & (U256::from(0x2))).is_zero() {
        ratio = (ratio * uint!(0xfff97272373d413259a46990580e213a_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x4))).is_zero() {
        ratio = (ratio * uint!(0xfff2e50f5f656932ef12357cf3c7fdcc_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x8))).is_zero() {
        ratio = (ratio * uint!(0xffe5caca7e10e4e61c3624eaa0941cd0_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x10))).is_zero() {
        ratio = (ratio * uint!(0xffcb9843d60f6159c9db58835c926644_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x20))).is_zero() {
        ratio = (ratio * uint!(0xff973b41fa98c081472e6896dfb254c0_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x40))).is_zero() {
        ratio = (ratio * uint!(0xff2ea16466c96a3843ec78b326b52861_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x80))).is_zero() {
        ratio = (ratio * uint!(0xfe5dee046a99a2a811c461f1969c3053_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x100))).is_zero() {
        ratio = (ratio * uint!(0xfcbe86c7900a88aedcffc83b479aa3a4_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x200))).is_zero() {
        ratio = (ratio * uint!(0xf987a7253ac413176f2b074cf7815e54_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x400))).is_zero() {
        ratio = (ratio * uint!(0xf3392b0822b70005940c7a398e4b70f3_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x800))).is_zero() {
        ratio = (ratio * uint!(0xe7159475a2c29b7443b29c7fa6e889d9_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x1000))).is_zero() {
        ratio = (ratio * uint!(0xd097f3bdfd2022b8845ad8f792aa5825_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x2000))).is_zero() {
        ratio = (ratio * uint!(0xa9f746462d870fdf8a65dc1f90e061e5_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x4000))).is_zero() {
        ratio = (ratio * uint!(0x70d869a156d2a1b890bb3df62baf32f7_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x8000))).is_zero() {
        ratio = (ratio * uint!(0x31be135f97d08fd981231505542fcfa6_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x10000))).is_zero() {
        ratio = (ratio * uint!(0x9aa508b5b7a84e1c677de54f3e99bc9_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x20000))).is_zero() {
        ratio = (ratio * uint!(0x5d6af8dedb81196699c329225ee604_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x40000))).is_zero() {
        ratio = (ratio * uint!(0x2216e584f5fa1ea926041bedfe98_U256)) >> 128
    }
    if !(abs_tick & (U256::from(0x80000))).is_zero() {
        ratio = (ratio * uint!(0x48a170391f7dc42444e8fa2_U256)) >> 128
    }

    if tick > 0 {
        ratio = U256::MAX / ratio;
    }

    Ok((ratio >> 32)
        + if (ratio % (U256::one() << 32) as U256).is_zero() {
            U256::zero()
        } else {
            U256::one()
        })
}
