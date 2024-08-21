#[cfg(all(test, not(target_arch = "wasm32")))]
mod testing {
    use libleo;

    use stylus_sdk::{
        alloy_primitives::{address, Address, FixedBytes, U256},
        block,
    };

    const POOL: Address = address!("6221a9c005f6e47eb398fd867784cacfdcfff4e7");
    const CAMPAIGN_ID: FixedBytes<8> = FixedBytes::ZERO;
    const POS_ID: U256 = U256::ZERO;

    #[test]
    fn campaign_creation() {
        libleo::host::with_storage::<_, libleo::Leo, _>(
            &[(POOL, POS_ID, -10, 100, U256::from(100))],
            |leo| {
                let expected_starting = block::timestamp();
                let expected_ending = expected_starting + 1000;

                leo.ctor(Address::ZERO).unwrap();

                leo.create_campaign(
                    CAMPAIGN_ID,       // Identifier
                    POOL,              // Pool
                    -20,               // Tick lower
                    100,               // Tick upper
                    U256::from(2),     // Per second distribution
                    POOL,              // Token to send
                    U256::from(100),   // Starting pool of liquidity
                    expected_starting, // Starting timestamp
                    expected_ending,   // Ending timestamp
                )
                .unwrap();
                // Check that the campaign queries correctly.
                let (lower, upper, per_second, token, distributed, maximum, starting, ending) =
                    leo.campaign_details(POOL, CAMPAIGN_ID).unwrap();
                assert_eq!(lower, -20);
                assert_eq!(upper, 100);
                assert_eq!(per_second, U256::from(2));
                assert_eq!(token, POOL);
                assert_eq!(distributed, U256::ZERO);
                assert_eq!(maximum, U256::from(100));
                assert_eq!(starting, expected_starting);
                assert_eq!(ending, expected_ending);
            },
        )
    }

    #[test]
    fn lower_tick_out_of_range() {
        libleo::host::with_storage::<_, libleo::Leo, _>(
            &[(POOL, POS_ID, -10, 100, U256::from(100))],
            |leo| {
                leo.ctor(Address::ZERO).unwrap();

                leo.create_campaign(
                    CAMPAIGN_ID,                // Identifier
                    POOL,                       // Pool
                    0,                          // Tick lower
                    1,                          // Tick upper
                    U256::from(100),            // Per second distribution
                    POOL,                       // Token to send
                    U256::from(100),            // Starting pool of liquidity
                    block::timestamp() - 20000, // Starting timestamp
                    block::timestamp() + 1000,  // Ending timestamp
                )
                .unwrap();

                leo.vest_position(POOL, POS_ID).unwrap();

                assert!(
                    leo.collect_lp_rewards(POOL, POS_ID, vec![CAMPAIGN_ID])
                        .unwrap()
                        .len()
                        == 0
                );
            },
        )
    }

    #[test]
    fn upper_tick_out_of_range() {
        libleo::host::with_storage::<_, libleo::Leo, _>(
            &[(POOL, POS_ID, 0, 100, U256::from(1000))],
            |leo| {
                leo.ctor(Address::ZERO).unwrap();

                leo.vest_position(POOL, POS_ID).unwrap();

                assert!(leo.vest_position(POOL, POS_ID).is_err());

                leo.create_campaign(
                    CAMPAIGN_ID,                // Identifier
                    POOL,                       // Pool
                    0,                          // Tick lower
                    1,                          // Tick upper
                    U256::from(100),            // Per second distribution
                    POOL,                       // Token to send
                    U256::from(100),            // Starting pool of liquidity
                    block::timestamp() - 20000, // Starting timestamp
                    block::timestamp() + 1000,  // Ending timestamp
                )
                .unwrap();

                assert!(
                    leo.collect_lp_rewards(POOL, POS_ID, vec![CAMPAIGN_ID])
                        .unwrap()
                        .len()
                        == 0
                );
            },
        )
    }

    #[test]
    fn campaign_created_cancelled_then_claimed() {
        libleo::host::with_storage::<_, libleo::Leo, _>(
            &[(POOL, POS_ID, -10, 100, U256::from(123))],
            |leo| {
                let expected_starting = block::timestamp();
                let expected_ending = expected_starting + 1000;

                leo.ctor(Address::ZERO).unwrap();

                leo.vest_position(POOL, POS_ID).unwrap();

                // Someone goes to create a campaign.

                leo.create_campaign(
                    CAMPAIGN_ID,       // Identifier
                    POOL,              // Pool
                    -20,               // Tick lower
                    100,               // Tick upper
                    U256::from(2),     // Per second distribution
                    POOL,              // Token to send
                    U256::from(100),   // Starting pool of liquidity
                    expected_starting, // Starting timestamp
                    expected_ending,   // Ending timestamp
                )
                .unwrap();

                // Someone claims from it...

                leo.collect_lp_rewards(POOL, POS_ID, vec![CAMPAIGN_ID])
                    .unwrap();

                // Then the campaign author cancels it!

                leo.cancel_campaign(POOL, CAMPAIGN_ID).unwrap();

                // Then the same user claims again, but they shouldn't receive anything.

                assert_eq!(
                    leo.collect_lp_rewards(POOL, POS_ID, vec![CAMPAIGN_ID])
                        .unwrap()
                        .len(),
                    0
                );

                assert_eq!(
                    leo.collect_lp_rewards(POOL, POS_ID, vec![CAMPAIGN_ID])
                        .unwrap()
                        .len(),
                    0
                );

                assert_eq!(
                    leo.collect_lp_rewards(POOL, POS_ID, vec![CAMPAIGN_ID])
                        .unwrap()
                        .len(),
                    0
                );
            },
        )
    }

    #[test]
    fn campaign_created_claimed_then_updated_claim_again() {
        libleo::host::with_storage::<_, libleo::Leo, _>(
            &[(POOL, POS_ID, -10, 100, U256::from(1000))],
            |leo| {
                let expected_starting = block::timestamp() - 1000;
                let expected_ending = block::timestamp() + 1000;

                leo.ctor(Address::ZERO).unwrap();

                leo.vest_position(POOL, POS_ID).unwrap();

                // Someone goes to create a campaign.

                leo.create_campaign(
                    CAMPAIGN_ID,                      // Identifier
                    POOL,                             // Pool
                    -20,                              // Tick lower
                    100,                              // Tick upper
                    U256::from(2),                    // Per second distribution
                    POOL,                             // Token to send
                    U256::from(1000000000000000_i64), // Starting pool of liquidity
                    expected_starting,                // Starting timestamp
                    expected_ending,                  // Ending timestamp
                )
                .unwrap();

                // Someone claims from it...

                let earned_rewards = leo
                    .collect_lp_rewards(POOL, POS_ID, vec![CAMPAIGN_ID])
                    .unwrap()[0]
                    .1;

                eprintln!("we're done claiming the first time");

                // Then the campaign author updates it in the future...

                // It's weird if someone tries to adjust the starting time to be earlier,
                // but it could happen, so we test it.
                leo.update_campaign(
                    CAMPAIGN_ID,
                    POOL,
                    -10,
                    120,
                    U256::from(5),
                    U256::ZERO,
                    block::timestamp(),
                    expected_ending,
                )
                .unwrap();

                // Then the same user claims again.

                let extra_rewards = leo
                    .collect_lp_rewards(POOL, POS_ID, vec![CAMPAIGN_ID])
                    .unwrap()[0]
                    .1;

                leo.admin_reduce_campaign_starting_last_iteration(POOL, CAMPAIGN_ID, 200)
                    .unwrap();

                assert_eq!(
                    extra_rewards.to_string(),
                    (libleo::maths::calc_base_rewards(
                        U256::from(1000),
                        U256::from(1000),
                        U256::from(5)
                    ) * U256::from(1000))
                    .to_string()
                );
            },
        )
    }
}

#[cfg(all(test, not(target_arch = "wasm32")))]
mod proptesting {
    use libleo;
    use proptest::prelude::*;

    use stylus_sdk::{
        alloy_primitives::{Address, FixedBytes, U256},
        block,
    };

    const POOL: Address = Address::ZERO;
    const CAMPAIGN_ID: FixedBytes<8> = FixedBytes::ZERO;

    const POS_ID: U256 = U256::ZERO;
    const POS_ID_OTHER: U256 = U256::from_limbs([1, 0, 0, 0]);

    const MIN_TICK: i32 = -887272;
    const MAX_TICK: i32 = -MIN_TICK;

    proptest! {
        #[test]
        fn proptest_full_story(
            mut tick_lower in MIN_TICK..MAX_TICK,
            mut tick_upper in MIN_TICK..MAX_TICK,
            per_second in 1..u64::MAX,
            starting_pool in any::<[u64; 4]>(),
            expected_starting in 0..libleo::host::current_timestamp(),
            expected_ending in any::<u64>(),
            secs_in in 1..u64::MAX,
            position_lp in any::<[u64; 4]>(),
            other_position_lp in any::<[u64; 4]>()
        ) {
            let starting_pool = U256::from_limbs(starting_pool);
            let position_lp = U256::from_limbs(position_lp) + U256::from(1);
            let other_position_lp = U256::from_limbs(other_position_lp) + U256::from(1);

            if starting_pool.is_zero() || position_lp.is_zero() {
                return Ok(())
            }

            if tick_upper < tick_lower {
                (tick_lower, tick_upper) = (tick_upper, tick_lower);
            }

            let per_second = U256::from(per_second);

            libleo::host::with_storage::<_, libleo::Leo, _>(
                &[
                  (POOL, POS_ID, tick_lower, tick_upper, position_lp),
                  (POOL, POS_ID_OTHER, 0, 0, other_position_lp)
                ],
                |leo| {
                    let expected_ending = expected_starting + expected_ending;

                    leo.ctor(Address::ZERO).unwrap();

                    leo.create_campaign(
                        CAMPAIGN_ID,       // Identifier
                        POOL,              // Pool
                        tick_lower,        // Tick lower
                        tick_upper,        // Tick upper
                        per_second,        // Per second distribution
                        POOL,              // Token to send
                        starting_pool,     // Starting pool of liquidity
                        expected_starting, // Starting timestamp
                        expected_ending,   // Ending timestamp
                    ).unwrap();

                    assert_eq!(leo.pool_lp(POOL).unwrap(), U256::ZERO);

                    leo.vest_position(POOL, POS_ID_OTHER).unwrap();

                    assert_eq!(leo.pool_lp(POOL).unwrap(), other_position_lp);

                    leo.vest_position(POOL, POS_ID).unwrap();

                    assert_eq!(leo.pool_lp(POOL).unwrap(), other_position_lp + position_lp);

                    leo.admin_reduce_pos_time(POS_ID, 100).unwrap();

                    let reward = leo.collect_lp_rewards(POOL, POS_ID, vec![CAMPAIGN_ID]).unwrap()[0].1;

                    // We take either when the campaign ended, or the current timestamp
                    let clamped_campaign_ending =
                        u64::min(expected_ending, block::timestamp());

                    let seconds_since = clamped_campaign_ending - expected_starting;

                    let expected_reward =
                      libleo::maths::calc_base_rewards(other_position_lp + position_lp, position_lp, per_second) *
                      U256::from(seconds_since);

                    assert_eq!(expected_reward.to_string(), reward.to_string());

                    //assert_eq!(
                    //    leo.collect_lp_rewards(POOL, POS_ID, vec![CAMPAIGN_ID]).unwrap().len(),
                    //    0
                    //);

                    let (_, _, _, _, distributed, _, _, _) =
                        leo.campaign_details(POOL, CAMPAIGN_ID).unwrap();
                    assert_eq!(distributed, expected_reward);
                },
            )
        }
    }
}
