//! Structures and functions to track and update details on owned positions.

use crate::{
    error::*,
    maths::{full_math, liquidity_math},
    types::{WrappedNative, I32, U128, U256},
};

use stylus_sdk::{prelude::*, storage::*};

/// Storage type for the details on a position.
#[solidity_storage]
pub struct StoragePositionInfo {
    pub lower: StorageI32,
    pub upper: StorageI32,
    pub liquidity: StorageU128,
    pub fee_growth_inside_0: StorageU256,
    pub fee_growth_inside_1: StorageU256,
    pub token_owed_0: StorageU128,
    pub token_owed_1: StorageU128,
}

/// Container type for the map of position ID to position details.
#[solidity_storage]
pub struct StoragePositions {
    pub positions: StorageMap<U256, StoragePositionInfo>,
}
impl StoragePositions {
    /// Initialises a new position with the position's bounds.
    ///
    /// # Calling requirements
    /// Requires that `id` has not been initialised before, and that `low` and `up` are in the
    /// correct order.
    #[allow(clippy::new_ret_no_self)]
    pub fn new(&mut self, id: U256, low: i32, up: i32) {
        let mut info = self.positions.setter(id);
        info.lower.set(I32::lib(&low));
        info.upper.set(I32::lib(&up));
    }

    /// Updates a position, refreshing the amount of fees the position has earned and updating its
    /// liquidity.
    pub fn update(
        &mut self,
        id: U256,
        delta: i128,
        fee_growth_inside_0: U256,
        fee_growth_inside_1: U256,
    ) -> Result<(), Error> {
        let mut info = self.positions.setter(id);

        let owed_fees_0 = full_math::mul_div(
            fee_growth_inside_0
                .checked_sub(info.fee_growth_inside_0.get())
                .ok_or(Error::FeeGrowthSubPos)?,
            U256::from(info.liquidity.get()),
            full_math::Q128,
        )?;

        let owed_fees_1 = full_math::mul_div(
            fee_growth_inside_1
                .checked_sub(info.fee_growth_inside_1.get())
                .ok_or(Error::FeeGrowthSubPos)?,
            U256::from(info.liquidity.get()),
            full_math::Q128,
        )?;

        let liquidity_next = liquidity_math::add_delta(info.liquidity.get().sys(), delta)?;

        if delta != 0 {
            info.liquidity.set(U128::lib(&liquidity_next));
        }

        info.fee_growth_inside_0.set(fee_growth_inside_0);
        info.fee_growth_inside_1.set(fee_growth_inside_1);
        if !owed_fees_0.is_zero() {
            // overflow is the user's problem, they should withdraw earlier
            let new_fees_0 = info
                .token_owed_0
                .get()
                .wrapping_add(U128::wrapping_from(owed_fees_0));
            info.token_owed_0.set(new_fees_0);
        }
        if !owed_fees_1.is_zero() {
            let new_fees_1 = info
                .token_owed_1
                .get()
                .wrapping_add(U128::wrapping_from(owed_fees_1));
            info.token_owed_1.set(new_fees_1);
        }

        Ok(())
    }

    pub fn fees_owed(&self, id: U256) -> (u128, u128) {
        let position = self.positions.getter(id);
        (
            position.token_owed_0.get().sys(),
            position.token_owed_1.get().sys(),
        )
    }

    /// Collects fees from a position, returning the amount of each token collected.
    ///
    /// # Arguments
    /// * `id` - The position ID of the position to collect fees for.
    pub fn collect_fees(&mut self, id: U256) -> (u128, u128) {
        let mut position = self.positions.setter(id);

        let amount_0 = position.token_owed_0.get().sys();
        let amount_1 = position.token_owed_1.get().sys();

        if amount_0 > 0 {
            position.token_owed_0.set(U128::ZERO);
        }
        if amount_1 > 0 {
            position.token_owed_1.set(U128::ZERO);
        }

        (amount_0, amount_1)
    }
}
