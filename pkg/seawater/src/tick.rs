//! Structures and functions to track and update details on a pool's ticks.

use crate::error::*;
use crate::maths::liquidity_math;
use crate::types::*;

#[cfg(feature = "testing-dbg")]
use crate::current_test;

use stylus_sdk::prelude::*;
use stylus_sdk::storage::*;

/// Storage map type for a tick bitmap distributed over several words.
pub type TickBitmap = stylus_sdk::storage::StorageMap<i16, stylus_sdk::storage::StorageU256>;

/// Container type for a [TickBitmap].
#[solidity_storage]
pub struct StorageTickBitmap {
    pub bitmap: TickBitmap,
}

impl StorageTickBitmap {
    /// Toggles a tick on the bitmap.
    pub fn flip(&mut self, tick: i32, spacing: u8) {
        let spacing = spacing as i32;
        assert!(tick % spacing == 0); // ensure the tick lies on a valid space

        let spaced_tick = tick / spacing;
        let (word_pos, bit_pos) = ((spaced_tick >> 8) as i16, (spaced_tick % 256));

        let mask = U256::one().wrapping_shl(bit_pos as usize);
        let bitmap = self.bitmap.get(word_pos) ^ mask;

        #[cfg(feature = "testing-dbg")]
        dbg!((
            "inside flip",
            mask.to_string(),
            bitmap.to_string(),
            word_pos
        ));

        self.bitmap.setter(word_pos).set(bitmap);
    }
}

/// Storage type for details on a tick.
#[solidity_storage]
#[derive(Erase)]
pub struct StorageTickInfo {
    liquidity_gross: StorageU128,
    liquidity_net: StorageI128,
    fee_growth_outside_0: StorageU256,
    fee_growth_outside_1: StorageU256,
    tick_cumulative_outside: StorageI64,
    seconds_per_liquidity_outside: StorageU160,
    seconds_outside: StorageU32,
    initialised: StorageBool,
}

/// Container type for the map of tick indexes to ticks.
#[solidity_storage]
pub struct StorageTicks {
    pub ticks: StorageMap<i32, StorageTickInfo>,
}

impl StorageTicks {
    /// Updates a tick with liquidity and fee data, initialising it if it was not before. Returns
    /// if the tick changed activation state.
    #[allow(clippy::too_many_arguments)]
    pub fn update(
        &mut self,
        tick: i32,
        cur_amm_tick: i32,
        liquidity_delta: i128,
        fee_growth_global_0: &U256,
        fee_growth_global_1: &U256,
        upper: bool,
        max_liquidity: u128,
    ) -> Result<bool, Error> {
        let mut info = self.ticks.setter(tick);

        let liquidity_gross_before = info.liquidity_gross.get().sys();
        let liquidity_gross_after =
            liquidity_math::add_delta(liquidity_gross_before, liquidity_delta)?;

        if liquidity_gross_after > max_liquidity {
            return Err(Error::LiquidityTooHigh);
        }

        // if we moved to or from 0 liquidity, flip the tick
        let tick_flipped = (liquidity_gross_after == 0) != (liquidity_gross_before == 0);

        if liquidity_gross_before == 0 {
            // initialise ourself

            // if we're below the current tick then set fee growth outside
            if tick <= cur_amm_tick {
                info.fee_growth_outside_0.set(*fee_growth_global_0);
                info.fee_growth_outside_1.set(*fee_growth_global_1);
            }
            info.initialised.set(true);
        }

        info.liquidity_gross.set(U128::lib(&liquidity_gross_after));

        let new_liquidity_net = match upper {
            true => info
                .liquidity_net
                .get()
                .checked_sub(I128::lib(&liquidity_delta))
                .ok_or(Error::LiquiditySub),
            false => info
                .liquidity_net
                .get()
                .checked_add(I128::lib(&liquidity_delta))
                .ok_or(Error::LiquidityAdd),
        }?;

        info.liquidity_net.set(new_liquidity_net);

        Ok(tick_flipped)
    }

    /// Gets the fee growth inside a tick range.
    pub fn get_fee_growth_inside(
        &mut self,
        lower_tick: i32,
        upper_tick: i32,
        cur_tick: i32,
        fee_growth_global_0: &U256,
        fee_growth_global_1: &U256,
    ) -> Result<(U256, U256), Error> {
        // the fee growth inside this tick is the total fee
        // growth, minus the fee growth outside this tick
        let lower = self.ticks.get(lower_tick);
        let upper = self.ticks.get(upper_tick);

        let (fee_growth_below_0, fee_growth_below_1) = if cur_tick >= lower_tick {
            #[cfg(feature = "testing-dbg")]
            dbg!((
                "cur_tick >= lower_tick",
                current_test!(),
                lower.fee_growth_outside_0.get().to_string(),
                lower.fee_growth_outside_1.get().to_string()
            ));

            (
                lower.fee_growth_outside_0.get(),
                lower.fee_growth_outside_1.get(),
            )
        } else {
            #[cfg(feature = "testing-dbg")]
            dbg!((
                "cur_tick < lower_tick",
                current_test!(),
                fee_growth_global_0,
                fee_growth_global_1,
                lower.fee_growth_outside_0.get().to_string(),
                lower.fee_growth_outside_1.get().to_string()
            ));

            (
                fee_growth_global_0
                    .checked_sub(lower.fee_growth_outside_0.get())
                    .ok_or(Error::FeeGrowthSubTick)?,
                fee_growth_global_1
                    .checked_sub(lower.fee_growth_outside_1.get())
                    .ok_or(Error::FeeGrowthSubTick)?,
            )
        };

        let (fee_growth_above_0, fee_growth_above_1) = if cur_tick < upper_tick {
            #[cfg(feature = "testing-dbg")]
            dbg!((
                "cur_tick < upper_tick",
                current_test!(),
                upper.fee_growth_outside_0.get().to_string(),
                upper.fee_growth_outside_1.get().to_string()
            ));

            (
                upper.fee_growth_outside_0.get(),
                upper.fee_growth_outside_1.get(),
            )
        } else {
            #[cfg(feature = "testing-dbg")]
            dbg!((
                "cur_tick >= upper_tick",
                current_test!(),
                fee_growth_global_0,
                fee_growth_global_1,
                upper.fee_growth_outside_0.get(),
                upper.fee_growth_outside_1.get()
            ));

            (
                fee_growth_global_0
                    .checked_sub(upper.fee_growth_outside_0.get())
                    .ok_or(Error::FeeGrowthSubTick)?,
                fee_growth_global_1
                    .checked_sub(upper.fee_growth_outside_1.get())
                    .ok_or(Error::FeeGrowthSubTick)?,
            )
        };

        #[cfg(feature = "testing-dbg")] // REMOVEME
        {
            if *fee_growth_global_0 < fee_growth_below_0 {
                dbg!((
                    "fee_growth_global_0 < fee_growth_below_0",
                    current_test!(),
                    fee_growth_global_0.to_string(),
                    fee_growth_below_0.to_string()
                ));
            }
            let fee_growth_global_0 = fee_growth_global_0.checked_sub(fee_growth_below_0).unwrap();
            if fee_growth_global_0 < fee_growth_above_0 {
                dbg!((
                    "fee_growth_global_0 < fee_growth_above_0",
                    current_test!(),
                    fee_growth_global_0.to_string(),
                    fee_growth_above_0.to_string()
                ));
            }
        }

        #[cfg(feature = "testing-dbg")]
        dbg!((
            "final stage checked sub below",
            current_test!(),
            fee_growth_global_0
                .checked_sub(fee_growth_below_0)
                .and_then(|x| x.checked_sub(fee_growth_above_0))
        ));

        Ok((
            fee_growth_global_0
                .checked_sub(fee_growth_below_0)
                .and_then(|x| x.checked_sub(fee_growth_above_0))
                .ok_or(Error::FeeGrowthSubTick)?,
            fee_growth_global_1
                .checked_sub(fee_growth_below_1)
                .and_then(|x| x.checked_sub(fee_growth_above_1))
                .ok_or(Error::FeeGrowthSubTick)?,
        ))
    }

    /// Updates a tick's fee information when the tick is crossed.
    pub fn cross(
        &mut self,
        tick: i32,
        fee_growth_global_0: &U256,
        fee_growth_global_1: &U256,
    ) -> i128 {
        let mut info = self.ticks.setter(tick);

        let new_fee_growth_outside_0 = fee_growth_global_0 - info.fee_growth_outside_0.get();
        info.fee_growth_outside_0.set(new_fee_growth_outside_0);

        let new_fee_growth_outside_1 = fee_growth_global_1 - info.fee_growth_outside_1.get();
        info.fee_growth_outside_1.set(new_fee_growth_outside_1);

        let r = info.liquidity_net.sys();
        #[cfg(feature = "testing-dbg")]
        dbg!(("liquidity net", r));
        r
    }

    /// Deletes a tick from the map, freeing storage slots.
    pub fn clear(&mut self, tick: i32) {
        // delete a tick
        self.ticks.delete(tick);
    }
}
