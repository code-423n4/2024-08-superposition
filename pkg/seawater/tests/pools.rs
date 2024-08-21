use libseawater::{error::Error, maths::tick_math, pool::*, test_utils, types::*};

use ruint_macro::uint;

#[test]
fn test_update_position() {
    test_utils::with_storage::<_, StoragePool, _>(None, None, None, None, |storage| {
        storage
            .init(test_utils::encode_sqrt_price(1, 10), 0, 1, u128::MAX)
            .unwrap();

        storage.enabled.set(true);

        let id = uint!(2_U256);

        storage
            .create_position(id, tick_math::get_min_tick(1), tick_math::get_max_tick(1))
            .unwrap();

        assert_eq!(
            storage.update_position(id, 3161),
            Ok((I256::unchecked_from(9996), I256::unchecked_from(1000))),
        );
    });
}

#[test]
fn test_update_position_2() {
    test_utils::with_storage::<_, StoragePool, _>(None, None, None, None, |storage| {
        storage
            .init(test_utils::encode_sqrt_price(1, 10), 0, 1, u128::MAX)
            .unwrap();

        storage.enabled.set(true);

        let id = uint!(2_U256);

        storage.create_position(id, -874753, -662914).unwrap();

        assert_eq!(
            storage.update_position(id, 24703680000000000000000),
            Ok((I256::unchecked_from(0), I256::unchecked_from(99649663))),
        );
    });
}

#[test]
fn test_swap() -> Result<(), Vec<u8>> {
    test_utils::with_storage::<_, StoragePool, _>(None, None, None, None, |storage| {
        storage.init(
            test_utils::encode_sqrt_price(100, 1), // price
            0,
            1,
            u128::MAX,
        )?;

        storage.enabled.set(true);

        let id = uint!(2_U256);
        storage
            .create_position(
                id,
                tick_math::get_tick_at_sqrt_ratio(test_utils::encode_sqrt_price(50, 1))?,
                tick_math::get_tick_at_sqrt_ratio(test_utils::encode_sqrt_price(150, 1))?,
            )
            .unwrap();
        storage.update_position(id, 100)?;

        let id = uint!(3_U256);
        storage
            .create_position(
                id,
                tick_math::get_tick_at_sqrt_ratio(test_utils::encode_sqrt_price(80, 1))?,
                tick_math::get_tick_at_sqrt_ratio(test_utils::encode_sqrt_price(150, 1))?,
            )
            .unwrap();
        storage.update_position(id, 100)?;

        storage.swap(
            true,
            I256::unchecked_from(-10),
            test_utils::encode_sqrt_price(60, 1),
        )?;

        storage.swap(
            true,
            I256::unchecked_from(10),
            test_utils::encode_sqrt_price(50, 1),
        )?;

        storage.swap(
            false,
            I256::unchecked_from(10),
            test_utils::encode_sqrt_price(120, 1),
        )?;

        storage.swap(
            false,
            I256::unchecked_from(-10000),
            test_utils::encode_sqrt_price(120, 1),
        )?;

        Ok(())
    })
}

#[test]
fn test_pool_init_state() -> Result<(), Vec<u8>> {
    test_utils::with_storage::<_, StoragePool, _>(None, None, None, None, |pool| {
        let price = test_utils::encode_sqrt_price(100, 1);

        pool.init(price, 2, 1, u128::MAX)?;

        assert_eq!(pool.enabled.get(), false);

        pool.enabled.set(true);

        assert_eq!(pool.sqrt_price.get(), price);

        assert_eq!(
            pool.cur_tick.get(),
            I32::lib(&tick_math::get_tick_at_sqrt_ratio(price)?)
        );

        assert_eq!(pool.fee.get(), U32::lib(&2));

        assert_eq!(pool.tick_spacing.get(), U8::lib(&1));

        assert_eq!(pool.max_liquidity_per_tick.get(), U128::lib(&u128::MAX));

        Ok(())
    })
}

#[test]
fn test_pool_init_reverts() -> Result<(), Vec<u8>> {
    test_utils::with_storage::<_, StoragePool, _>(None, None, None, None, |storage| {
        match storage.init(uint!(1_U256), 0, 0, 0_u128) {
            Err(r) => assert_eq!(Error::R.to_string(), String::from_utf8(r).unwrap()),
            _ => panic!("expected R"),
        }

        match storage.init(test_utils::encode_sqrt_price(100, 1), 0, 1, u128::MAX) {
            Err(r) => assert_eq!(
                Error::PoolAlreadyInitialised.to_string(),
                String::from_utf8(r).unwrap()
            ),
            _ => panic!("expected PoolAlreadyInitialised"),
        }
        Ok(())
    })
}

#[test]
fn test_pool_swaps_reverts() {
    test_utils::with_storage::<_, StoragePool, _>(None, None, None, None, |pool| {
        let sqrt_price = test_utils::encode_sqrt_price(1, 1);

        match pool.swap(true, I256::unchecked_from(1), sqrt_price) {
            Err(r) => assert_eq!(
                Error::PoolDisabled.to_string(),
                String::from_utf8(r).unwrap()
            ),
            _ => panic!("expected PoolDisabled"),
        }

        pool.init(sqrt_price, 1, 1, u128::MAX).unwrap();

        pool.enabled.set(true);

        match pool.swap(true, I256::unchecked_from(1), sqrt_price + U256::from(1)) {
            Err(r) => assert_eq!(
                Error::PriceLimitTooLow.to_string(),
                String::from_utf8(r).unwrap()
            ),
            _ => panic!("expected PriceLimitTooLow"),
        }

        match pool.swap(true, I256::unchecked_from(1), tick_math::MIN_SQRT_RATIO) {
            Err(r) => assert_eq!(
                Error::PriceLimitTooLow.to_string(),
                String::from_utf8(r).unwrap()
            ),
            _ => panic!("expected PriceLimitTooLow"),
        }

        match pool.swap(false, I256::unchecked_from(1), tick_math::MAX_SQRT_RATIO) {
            Err(r) => assert_eq!(
                Error::PriceLimitTooHigh.to_string(),
                String::from_utf8(r).unwrap()
            ),
            _ => panic!("expected PriceLimitTooHigh"),
        }

        match pool.swap(false, I256::unchecked_from(1), sqrt_price - U256::from(1)) {
            Err(r) => assert_eq!(
                Error::PriceLimitTooHigh.to_string(),
                String::from_utf8(r).unwrap()
            ),
            _ => panic!("expected PriceLimitTooHigh"),
        }
    });
}

#[test]
fn test_pool_position_create() -> Result<(), Vec<u8>> {
    test_utils::with_storage::<_, StoragePool, _>(None, None, None, None, |pool| {
        let id = uint!(2_U256);
        let low = tick_math::get_tick_at_sqrt_ratio(test_utils::encode_sqrt_price(50, 1))?;
        let up = tick_math::get_tick_at_sqrt_ratio(test_utils::encode_sqrt_price(150, 1))?;

        match pool.create_position(id, low, up) {
            Err(r) => assert_eq!(
                Error::PoolDisabled.to_string(),
                String::from_utf8(r).unwrap()
            ),
            _ => panic!("expected PoolDisabled"),
        }

        pool.init(
            test_utils::encode_sqrt_price(100, 1), // price
            0,
            10,
            u128::MAX,
        )?;

        pool.enabled.set(true);

        match pool.create_position(id, 11, 17) {
            Err(r) => assert_eq!(
                Error::InvalidTickSpacing.to_string(),
                String::from_utf8(r).unwrap()
            ),
            _ => panic!("expected InvalidTickSpacing"),
        }

        pool.create_position(id, low - low % 10, up - up % 10)?;

        let position_saved = pool.positions.positions.get(id);

        assert_eq!(position_saved.lower.get().as_i32(), low - low % 10);
        assert_eq!(position_saved.upper.get().as_i32(), up - up % 10);

        Ok(())
    })
}

#[test]
fn test_pool_update_position_reverts() {
    test_utils::with_storage::<_, StoragePool, _>(None, None, None, None, |pool| {
        pool.init(test_utils::encode_sqrt_price(1, 10), 0, 1, u128::MAX)
            .unwrap();

        pool.enabled.set(true);

        let id = uint!(2_U256);

        pool.create_position(id, tick_math::get_min_tick(1), tick_math::get_max_tick(1))
            .unwrap();

        pool.set_enabled(false);

        match pool.update_position(id, 3161) {
            Err(r) => assert_eq!(
                Error::PoolDisabled.to_string(),
                String::from_utf8(r).unwrap()
            ),
            _ => panic!("expected PoolDisabled"),
        }

        match pool.update_position(id, 0) {
            Err(r) => assert_eq!(
                Error::PoolDisabled.to_string(),
                String::from_utf8(r).unwrap()
            ),
            _ => panic!("expected PoolDisabled"),
        }
    })
}

#[test]
fn test_pool_update_position_parametric() {
    let init_prices: [[i64; 2]; 9] = [
        [10, 10],
        [10, 33],
        [10, 171],
        [10, 16_381],
        [10, 1_048_572],
        [33, 10],
        [171, 10],
        [16_381, 10],
        [1_048_572, 10],
    ];

    let position_ranges: [[i64; 2]; 3] = [[-20, -10], [-10, 10], [10, 20]];

    let position_delta: Vec<i128> = (1..=20).map(|d| d * 10i128.pow(18)).collect();

    for price in init_prices.iter() {
        for delta in position_delta.iter() {
            for position_range in position_ranges.iter() {
                test_utils::with_storage::<_, StoragePool, _>(None, None, None, None, |pool| {
                    let init_price = test_utils::encode_sqrt_price(
                        price[0].unsigned_abs(),
                        price[1].unsigned_abs(),
                    );

                    let position_prices = [
                        price[0] + price[0] * position_range[0] / 100,
                        price[0] + price[0] * position_range[1] / 100,
                    ];

                    let low = tick_math::get_tick_at_sqrt_ratio(test_utils::encode_sqrt_price(
                        position_prices[0].unsigned_abs(),
                        price[1].unsigned_abs(),
                    ))
                    .unwrap();

                    let up = tick_math::get_tick_at_sqrt_ratio(test_utils::encode_sqrt_price(
                        position_prices[1].unsigned_abs(),
                        price[1].unsigned_abs(),
                    ))
                    .unwrap();

                    pool.init(init_price, 3000, 60 as u8, u128::MAX).unwrap();

                    pool.enabled.set(true);

                    let id = uint!(2_U256);

                    let low_padded = low - low % 60;
                    let up_padded = up - up % 60;

                    pool.create_position(id, low_padded, up_padded).unwrap();

                    let liqudity = pool.liquidity.get().sys();

                    let (u0, u1) = pool.update_position(id, *delta).unwrap();

                    if position_prices[0] < price[0] && price[0] < position_prices[1] {
                        assert!(u0.gt(&I256::zero()));
                        assert!(u1.gt(&I256::zero()));
                        assert!(pool.liquidity.get().sys() - liqudity > 0);
                        pool.update_position(id, -delta).unwrap();
                        assert!(pool.liquidity.get().sys() == 0);
                    } else {
                        assert!(pool.liquidity.get().sys() - liqudity == 0);
                    }
                });
            }
        }
    }
}

#[test]
fn test_swap_inside_liq_range() -> Result<(), Vec<u8>> {
    let pos_id = uint!(777_U256);

    let delta = 10i128.pow(18);

    let init_price = test_utils::encode_sqrt_price(100_000, 1_000);

    let liq_price_inside = [50_000, 150_000];

    //Swap up to 1% of the liquidity
    let swap_amounts: Vec<i128> = (1..=10).map(|p| p * delta / 1_000).collect();

    for swap_amount in &swap_amounts {
        // Price inside liquidity range
        test_utils::with_storage::<_, StoragePool, _>(None, None, None, None, |pool| {
            pool.init(init_price, 3000, 60, u128::MAX).unwrap();

            pool.enabled.set(true);

            let lower = tick_math::get_tick_at_sqrt_ratio(test_utils::encode_sqrt_price(
                liq_price_inside[0],
                1_000,
            ))
            .unwrap();

            let upper = tick_math::get_tick_at_sqrt_ratio(test_utils::encode_sqrt_price(
                liq_price_inside[1],
                1_000,
            ))
            .unwrap();

            pool.create_position(pos_id, lower - lower % 60, upper - upper % 60)
                .unwrap();

            pool.update_position(pos_id, delta).unwrap();

            let (a0, _a1, _final_tick) = pool
                .swap(true, I256::unchecked_from(*swap_amount), U256::MAX)
                .unwrap();

            assert!(a0 == I256::unchecked_from(*swap_amount));
        });
    }

    Ok(())
}
