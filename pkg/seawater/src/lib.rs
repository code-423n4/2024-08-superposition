//! Implementation of the seawater AMM
//!
//! Seawater is an AMM designed for arbitrum's stylus environment based on uniswap v3.

#![feature(split_array)]
#![cfg_attr(not(target_arch = "wasm32"), feature(const_trait_impl))]
#![deny(clippy::unwrap_used)]

pub mod eth_serde;
pub mod immutables;
#[macro_use]
pub mod error;
pub mod events;

pub mod maths;
pub mod pool;
pub mod position;
pub mod tick;
pub mod types;

#[cfg(all(not(target_arch = "wasm32"), feature = "testing"))]
pub mod host_test_shims;

#[cfg(all(not(target_arch = "wasm32"), feature = "testing"))]
pub mod host_test_utils;

#[cfg(feature = "testing")]
pub mod test_shims;

#[cfg(feature = "testing")]
pub mod test_utils;

// Permit2 types exposed by the erc20 file.
pub mod permit2_types;

// We only want to have testing on the host environment and mocking stuff
// out in a testing context
#[cfg(all(not(target_arch = "wasm32"), feature = "testing"))]
pub mod host_erc20;

#[cfg(target_arch = "wasm32")]
pub mod wasm_erc20;

pub mod erc20;

use crate::{
    erc20::Permit2Args,
    types::{Address, I256Extension, I256, U256},
};

use error::Error;
use immutables::FUSDC_ADDR;
use maths::tick_math;

use types::{U256Extension, WrappedNative};

use stylus_sdk::{evm, msg, prelude::*, storage::*};

#[allow(dead_code)]
type RawArbResult = Option<Result<Vec<u8>, Vec<u8>>>;

// aliased for simplicity
type Revert = Vec<u8>;

extern crate alloc;
// only set a custom allocator if we're deploying on wasm
#[cfg(target_arch = "wasm32")]
mod allocator {
    use lol_alloc::{AssumeSingleThreaded, FreeListAllocator};
    // SAFETY: This application is single threaded, so using AssumeSingleThreaded is allowed.
    #[global_allocator]
    static ALLOCATOR: AssumeSingleThreaded<FreeListAllocator> =
        unsafe { AssumeSingleThreaded::new(FreeListAllocator::new()) };
}

// we split our entrypoint functions into three sets, and call them via diamond proxies, to
// save on binary size
#[cfg(not(any(
    feature = "swaps",
    feature = "swap_permit2",
    feature = "quotes",
    feature = "positions",
    feature = "update_positions",
    feature = "admin",
    feature = "migrations"
)))]
mod shim {
    #[cfg(target_arch = "wasm32")]
    compile_error!(
        "Either `swaps` or `swap_permit2` or `quotes` or `positions` or `update_positions`, `admin`, or `migrations` must be enabled when building for wasm."
    );
    #[stylus_sdk::prelude::external]
    impl crate::Pools {}
}

/// The root of seawater's storage. Stores variables needed globally, as well as the map of AMM
/// pools.
#[solidity_storage]
#[entrypoint]
pub struct Pools {
    // admin that can control the settings of everything. either the DAO, or the
    pub seawater_admin: StorageAddress,
    // the nft manager is a privileged account that can transfer NFTs!
    nft_manager: StorageAddress,

    pub pools: StorageMap<Address, pool::StoragePool>,
    // position NFTs
    pub next_position_id: StorageU256,
    // ID => owner
    position_owners: StorageMap<U256, StorageAddress>,
    // owner => count
    owned_positions: StorageMap<Address, StorageU256>,

    // address that's able to activate and disable emergency mode functionality
    emergency_council: StorageAddress,

    // authorised enablers to create new pools, and enable them
    authorised_enablers: StorageMap<Address, StorageBool>,
}

impl Pools {
    /// Raw swap function, implementing the uniswap v3 interface.
    ///
    /// This function is called by [Self::swap] and `swap_permit2`, which do
    /// argument decoding.
    ///
    /// # Arguments
    /// * `pool` - The pool to swap for. Pools are accessed as the address of their first token,
    /// where every pool has the fluid token as token 1.
    /// * `zero_for_one` - The swap direction. This is `true` if swapping to the fluid token, or
    /// `false` if swapping from the fluid token.
    /// * `amount` - The amount of token to swap. Follows the uniswap convention, where a positive
    /// amount will perform an exact in swap and a negative amount will perform an exact out swap.
    /// * `price_limit_x96` - The price limit, specified as an X96 encoded square root price.
    /// * `permit2` - Optional permit2 blob for the token being transfered - transfers will be done
    /// using permit2 if this is `Some`, or `transferFrom` if this is `None`.
    /// # Side effects
    /// This function transfers ERC20 tokens from and to the caller as per the swap. It takes
    /// tokens using ERC20's `transferFrom` method, and therefore must have approvals set before
    /// use.
    pub fn swap_internal(
        pools: &mut Pools,
        pool: Address,
        zero_for_one: bool,
        amount: I256,
        price_limit_x96: U256,
        permit2: Option<Permit2Args>,
    ) -> Result<(I256, I256), Revert> {
        let (amount_0, amount_1, ending_tick) =
            pools
                .pools
                .setter(pool)
                .swap(zero_for_one, amount, price_limit_x96)?;

        // entirely reentrant safe because stylus
        // denies all reentrancy unless explicity allowed (which we don't)

        // if zero_for_one, send them token1 and take token0
        let (take_token, take_amount, give_token, give_amount) = match zero_for_one {
            true => (pool, amount_0, FUSDC_ADDR, amount_1),
            false => (FUSDC_ADDR, amount_1, pool, amount_0),
        };

        erc20::take(take_token, take_amount.abs_pos()?, permit2)?;
        erc20::transfer_to_sender(give_token, give_amount.abs_neg()?)?;

        let amount_0_abs = amount_0
            .checked_abs()
            .ok_or(Error::SwapResultTooHigh)?
            .into_raw();
        let amount_1_abs = amount_1
            .checked_abs()
            .ok_or(Error::SwapResultTooHigh)?
            .into_raw();

        assert_or!(
            amount_0_abs > U256::zero() || amount_1_abs > U256::zero(),
            Error::SwapResultTooLow
        );

        evm::log(events::Swap1 {
            user: msg::sender(),
            pool,
            zeroForOne: zero_for_one,
            amount0: amount_0_abs,
            amount1: amount_1_abs,
            finalTick: ending_tick,
        });

        Ok((amount_0, amount_1))
    }

    /// Performs a two step swap internally, without performing any ERC20 transfers.
    fn swap_2_internal(
        pools: &mut Pools,
        from: Address,
        to: Address,
        amount: U256,
        min_out: U256,
    ) -> Result<(U256, U256, U256, I256, i32, i32), Revert> {
        let original_amount = amount;

        let amount = I256::try_from(amount).map_err(|_| Error::SwapResultTooHigh)?;

        // swap in -> usdc
        let (amount_in, interim_usdc_out, final_tick_in) = pools.pools.setter(from).swap(
            true,
            amount,
            // swap with no price limit, since we use min_out instead
            tick_math::MIN_SQRT_RATIO + U256::one(),
        )?;

        // make this positive for exact in
        let interim_usdc_out = interim_usdc_out
            .checked_neg()
            .ok_or(Error::InterimSwapPositive)?;

        // swap usdc -> out
        let (amount_out, interim_usdc_in, final_tick_out) = pools.pools.setter(to).swap(
            false,
            interim_usdc_out,
            tick_math::MAX_SQRT_RATIO - U256::one(),
        )?;

        let amount_in = amount_in.abs_pos()?;
        let amount_out = amount_out.abs_neg()?;

        #[cfg(feature = "testing-dbg")]
        dbg!((
            "inside swap_2_internal",
            interim_usdc_out,
            interim_usdc_in,
            amount_out.to_string(),
            min_out.to_string()
        ));

        assert_eq_or!(interim_usdc_out, interim_usdc_in, Error::InterimSwapNotEq);
        assert_or!(amount_out >= min_out, Error::MinOutNotReached);
        Ok((
            original_amount,
            amount_in,
            amount_out,
            interim_usdc_out,
            final_tick_in,
            final_tick_out,
        ))
    }

    /// Performs a two step swap, taking a permit2 blob for transfers.
    ///
    /// This function is called by [Self::swap_2] and `swap_2_permit2`, which do
    /// argument decoding.
    /// See [Self::swap] for more details on how this operates.
    pub fn swap_2_internal_erc20(
        pools: &mut Pools,
        from: Address,
        to: Address,
        amount: U256,
        min_out: U256,
        permit2: Option<Permit2Args>,
    ) -> Result<(U256, U256), Revert> {
        #[cfg(feature = "testing-dbg")]
        dbg!((
            "swap 2 internal erc20 at start",
            amount.to_string(),
            min_out.to_string()
        ));

        let (
            original_amount,
            amount_in,
            amount_out,
            interim_usdc_out,
            final_tick_in,
            final_tick_out,
        ) = Self::swap_2_internal(pools, from, to, amount, min_out)?;

        #[cfg(feature = "testing-dbg")]
        dbg!((
            "swap 2 internal erc20 after internal",
            amount_in.to_string(),
            amount_out.to_string()
        ));

        // transfer tokens
        erc20::take(from, original_amount, permit2)?;
        erc20::transfer_to_sender(to, amount_out)?;

        evm::log(events::Swap2 {
            user: msg::sender(),
            from,
            to,
            amountIn: amount_in,
            amountOut: amount_out,
            fluidVolume: interim_usdc_out.abs().into_raw(),
            finalTick0: final_tick_in,
            finalTick1: final_tick_out,
        });

        // return amount - amount_in to the user
        // send amount_out to the user
        Ok((amount_in, amount_out))
    }
}

/// Swap functions. Only enabled when the `swaps` feature is set.
#[cfg_attr(feature = "swaps", external)]
impl Pools {
    #[allow(non_snake_case)]
    pub fn swap_904369_B_E(
        &mut self,
        pool: Address,
        zero_for_one: bool,
        amount: I256,
        price_limit_x96: U256,
    ) -> Result<(I256, I256), Revert> {
        Pools::swap_internal(self, pool, zero_for_one, amount, price_limit_x96, None)
    }

    /// Performs a two stage swap, using approvals to transfer tokens. See [Self::swap_2_internal].
    #[allow(non_snake_case)]
    pub fn swap_2_exact_in_41203_F1_D(
        &mut self,
        from: Address,
        to: Address,
        amount: U256,
        min_out: U256,
    ) -> Result<(U256, U256), Revert> {
        Pools::swap_2_internal_erc20(self, from, to, amount, min_out, None)
    }
}

/// Quote functions. Only enabled when the `quotes` feature is set.
#[cfg_attr(feature = "quotes", external)]
impl Pools {
    /// Quote a [Self::swap]. Will revert with the result of the swap
    /// as a decimal number as the message of an `Error(string)`.
    /// Returns a `Result` as Stylus expects but will always only fill the `Revert`.
    #[allow(non_snake_case)]
    pub fn quote_72_E2_A_D_E7(
        &mut self,
        pool: Address,
        zero_for_one: bool,
        amount: I256,
        price_limit_x96: U256,
    ) -> Result<(), Revert> {
        let swapped = self
            .pools
            .setter(pool)
            .swap(zero_for_one, amount, price_limit_x96);

        match swapped {
            Ok((amount_0, amount_1, _)) => {
                // if zero_for_one, send them token1 and take token0
                let (give_token, give_amount) = match zero_for_one {
                    true => (FUSDC_ADDR, amount_1),
                    false => (pool, amount_0),
                };

                erc20::transfer_to_sender(give_token, give_amount.abs_neg()?)?;

                // we always want the token that was taken from the pool, so it's always negative
                let quote_amount = if zero_for_one { -amount_1 } else { -amount_0 };

                let revert = erc20::revert_from_msg(&quote_amount.to_dec_string());
                Err(revert)
            }
            // actual error, return it as normal
            Err(e) => Err(e),
        }
    }

    /// Quote a [Self::swap_2_exact_ine4f82465]. Will revert with the result of the swap
    /// as a decimal number as the message of an `Error(string)`.
    /// Returns a `Result` as Stylus expects but will always only fill the `Revert`.
    #[allow(non_snake_case)]
    pub fn quote_2_C_D06_B86_E(
        &mut self,
        from: Address,
        to: Address,
        amount: U256,
        min_out: U256,
    ) -> Result<(), Revert> {
        let swapped = Pools::swap_2_internal(self, from, to, amount, min_out);

        match swapped {
            Ok((_, _, amount_out, _, _, _)) => {
                erc20::transfer_to_sender(to, amount_out)?;
                let revert = erc20::revert_from_msg(&amount_out.to_string());
                Err(revert)
            }
            // actual error, return it as normal
            Err(e) => Err(e),
        }
    }
}

/// Swap functions using Permit2. Only enabled when the `swap_permit2` feature is set.
#[cfg_attr(feature = "swap_permit2", external)]
impl Pools {
    // slight hack - we cfg out the whole function, since the `selector` and `raw` attributes don't
    // actually exist, so we can't `cfg_attr` them in
    #[cfg(feature = "swap_permit2")]
    #[selector(
        id = "swapPermit2EE84AD91(address,bool,int256,uint256,uint256,uint256,uint256,bytes)"
    )]
    #[raw]
    #[allow(non_snake_case)]
    pub fn swap_permit_2_E_E84_A_D91(&mut self, data: &[u8]) -> RawArbResult {
        let (pool, data) = eth_serde::parse_addr(data);
        let (zero_for_one, data) = eth_serde::parse_bool(data);
        let (amount, data) = eth_serde::parse_i256(data);
        let (price_limit_x96, data) = eth_serde::parse_u256(data);
        let (nonce, data) = eth_serde::parse_u256(data);
        let (deadline, data) = eth_serde::parse_u256(data);
        let (max_amount, data) = eth_serde::parse_u256(data);
        let (_, data) = eth_serde::take_word(data); // placeholder
        let (sig, _) = eth_serde::parse_bytes(data);

        let permit2_args = Permit2Args {
            max_amount,
            nonce,
            deadline,
            sig,
        };

        match Pools::swap_internal(
            self,
            pool,
            zero_for_one,
            amount,
            price_limit_x96,
            Some(permit2_args),
        ) {
            Ok((a, b)) => Some(Ok([a.to_be_bytes::<32>(), b.to_be_bytes::<32>()].concat())),
            Err(e) => Some(Err(e)),
        }
    }

    /// Performs a two stage swap, using permit2 to transfer tokens. See [Self::swap_2_internal].
    #[cfg(feature = "swap_permit2")]
    #[selector(
        id = "swap2ExactInPermit236B2FDD8(address,address,uint256,uint256,uint256,uint256,bytes)"
    )]
    #[raw]
    #[allow(non_snake_case)]
    pub fn swap_2_exact_in_permit_2_36_B2_F_D_D8(&mut self, data: &[u8]) -> RawArbResult {
        let (from, data) = eth_serde::parse_addr(data);
        let (to, data) = eth_serde::parse_addr(data);
        let (amount, data) = eth_serde::parse_u256(data);
        let (min_out, data) = eth_serde::parse_u256(data);
        let (nonce, data) = eth_serde::parse_u256(data);
        let (deadline, data) = eth_serde::parse_u256(data);
        let (_, data) = eth_serde::take_word(data);
        let (sig, _) = eth_serde::parse_bytes(data);

        let permit2_args = Permit2Args {
            max_amount: amount,
            nonce,
            deadline,
            sig,
        };

        match Pools::swap_2_internal_erc20(self, from, to, amount, min_out, Some(permit2_args)) {
            Ok((a, b)) => Some(Ok([a.to_be_bytes::<32>(), b.to_be_bytes::<32>()].concat())),
            Err(e) => Some(Err(e)),
        }
    }
}

/// Internal functions for position management.
impl Pools {
    /// Makes the user the owner of a position. The position must not have an owner.
    fn grant_position(&mut self, owner: Address, id: U256) {
        // set owner
        self.position_owners.setter(id).set(owner);

        // increment count
        let owned_positions_count = self.owned_positions.get(owner) + U256::one();
        self.owned_positions
            .setter(owner)
            .set(owned_positions_count);
    }

    /// Removes the user as the owner of a position. The position must have an owner.
    fn remove_position(&mut self, owner: Address, id: U256) {
        // remove owner
        self.position_owners.setter(id).erase();

        // decrement count
        let owned_positions_count = self.owned_positions.get(owner) - U256::one();
        self.owned_positions
            .setter(owner)
            .set(owned_positions_count);
    }
}

/// Position management functions. Only enabled when the `positions` feature is set.
#[cfg_attr(feature = "positions", external)]
impl Pools {
    /// Creates a new, empty position, owned by a user.
    ///
    /// # Errors
    /// Requires the pool to exist and be enabled.
    #[allow(non_snake_case)]
    pub fn mint_position_B_C5_B086_D(
        &mut self,
        pool: Address,
        lower: i32,
        upper: i32,
    ) -> Result<U256, Revert> {
        let id = self.next_position_id.get();
        self.pools.setter(pool).create_position(id, lower, upper)?;

        self.next_position_id.set(id + U256::one());

        let owner = msg::sender();

        self.grant_position(owner, id);

        evm::log(events::MintPosition {
            id,
            owner,
            pool,
            lower,
            upper,
        });

        Ok(id)
    }

    /// Burns a position. Only usable by the position owner.
    ///
    /// Calling this function leaves any liquidity or fees left in the position inaccessible.
    ///
    /// # Errors
    /// Requires the position be owned by the caller. Requires the pool to be enabled.
    #[allow(non_snake_case)]
    pub fn burn_position_AE401070(&mut self, id: U256) -> Result<(), Revert> {
        let owner = msg::sender();
        assert_eq_or!(
            self.position_owners.get(id),
            owner,
            Error::PositionOwnerOnly
        );

        self.remove_position(owner, id);

        evm::log(events::BurnPosition { owner, id });

        Ok(())
    }

    /// Transfers a position's ownership from one address to another. Only usable by the NFT
    /// manager account.
    ///
    /// # Calling requirements
    /// Requires that the `from` address is the current owner of the position.
    ///
    /// # Errors
    /// Requires the caller be the NFT manager.
    #[allow(non_snake_case)]
    pub fn transfer_position_E_E_C7_A3_C_D(
        &mut self,
        id: U256,
        from: Address,
        to: Address,
    ) -> Result<(), Revert> {
        assert_eq_or!(msg::sender(), self.nft_manager.get(), Error::NftManagerOnly);

        self.remove_position(from, id);
        self.grant_position(to, id);

        evm::log(events::TransferPosition { from, to, id });

        Ok(())
    }

    /// Returns the current owner of a position.
    #[allow(non_snake_case)]
    pub fn position_owner_D7878480(&self, id: U256) -> Result<Address, Revert> {
        Ok(self.position_owners.get(id))
    }

    /// Returns the number of positions owned by an address.
    #[allow(non_snake_case)]
    pub fn position_balance_4_F32_C7_D_B(&self, user: Address) -> Result<U256, Revert> {
        Ok(self.owned_positions.get(user))
    }

    /// Returns the amount of liquidity in a position.
    #[allow(non_snake_case)]
    pub fn position_liquidity_8_D11_C045(&self, pool: Address, id: U256) -> Result<u128, Revert> {
        let liquidity = self.pools.getter(pool).get_position_liquidity(id);
        Ok(liquidity.sys())
    }

    #[allow(non_snake_case)]
    pub fn position_tick_lower_2_F_77_C_C_E_1(
        &self,
        pool: Address,
        id: U256,
    ) -> Result<i32, Revert> {
        let lower = self.pools.getter(pool).get_position_tick_lower(id);
        Ok(lower.sys())
    }

    #[allow(non_snake_case)]
    pub fn position_tick_upper_67_F_D_55_B_A(
        &self,
        pool: Address,
        id: U256,
    ) -> Result<i32, Revert> {
        let lower = self.pools.getter(pool).get_position_tick_upper(id);
        Ok(lower.sys())
    }

    #[allow(non_snake_case)]
    pub fn collect_single_to_6_D_76575_F(
        &mut self,
        pool: Address,
        id: U256,
        recipient: Address,
    ) -> Result<(u128, u128), Revert> {
        assert_eq_or!(
            msg::sender(),
            self.position_owners.get(id),
            Error::PositionOwnerOnly
        );

        let res = self.pools.setter(pool).collect(id)?;
        let (token_0, token_1) = res;

        evm::log(events::CollectFees {
            id,
            pool,
            to: msg::sender(),
            amount0: token_0,
            amount1: token_1,
        });

        erc20::transfer_to_addr(pool, recipient, U256::from(token_0))?;
        erc20::transfer_to_addr(FUSDC_ADDR, recipient, U256::from(token_1))?;

        Ok(res)
    }

    /// Collects AMM fees from a position, and triggers a release of fluid LP rewards.
    /// Only usable by the position's owner.
    ///
    /// # Arguments
    /// * `pools` - The pool the position belongs to.
    /// * `ids` - The ID of the positions.
    ///
    /// # Side effects
    /// Transfers tokens to the caller, and triggers a release of fluid LP rewards.
    ///
    /// # Errors
    /// Requires the caller to be the position owner. Requires the pool to be enabled.
    /// Requires the length of the pools and ids to be equal.
    #[allow(non_snake_case)]
    pub fn collect_7_F21947_C(
        &mut self,
        pools: Vec<Address>,
        ids: Vec<U256>,
    ) -> Result<Vec<(u128, u128)>, Revert> {
        assert_eq!(ids.len(), pools.len());

        pools
            .iter()
            .zip(ids.iter())
            .map(|(&pool, &id)| self.collect_single_to_6_D_76575_F(pool, id, msg::sender()))
            .collect::<Result<Vec<(u128, u128)>, Revert>>()
    }
}

impl Pools {
    /// Refreshes the amount of liquidity in a position, and adds or removes liquidity. Only usable
    /// by the position's owner.
    ///
    /// # Arguments
    /// * `pool` - The pool the position belongs to.
    /// * `id` - The ID of the position.
    /// * `delta` - The change to apply to the liquidity in the position.
    /// * `permit2` - Optional permit2 blob for the token being transfered - transfers will be done
    /// using permit2 if this is `Some`, or `transferFrom` if this is `None`.
    ///
    /// # Side effects
    /// Adding or removing liquidity will transfer tokens from or to the caller. Tokens are
    /// transfered with ERC20's `transferFrom`, so approvals must be set before calling.
    ///
    /// # Errors
    /// Requires token approvals to be set if adding liquidity. Requires the caller to be the
    /// position owner. Requires the pool to be enabled unless removing liquidity.
    pub fn update_position_internal(
        &mut self,
        pool: Address,
        id: U256,
        delta: i128,
        permit2: Option<(Permit2Args, Permit2Args)>,
    ) -> Result<(I256, I256), Revert> {
        assert_eq_or!(
            msg::sender(),
            self.position_owners.get(id),
            Error::PositionOwnerOnly
        );

        let (token_0, token_1) = self.pools.setter(pool).update_position(id, delta)?;

        #[cfg(feature = "testing-dbg")]
        dbg!(("update position taking", current_test!(), token_0, token_1));

        if delta < 0 {
            erc20::transfer_to_sender(pool, token_0.abs_neg()?)?;
            erc20::transfer_to_sender(FUSDC_ADDR, token_1.abs_neg()?)?;
        } else {
            let (permit_0, permit_1) = match permit2 {
                Some((permit_0, permit_1)) => (Some(permit_0), Some(permit_1)),
                None => (None, None),
            };

            erc20::take(pool, token_0.abs_pos()?, permit_0)?;
            erc20::take(FUSDC_ADDR, token_1.abs_pos()?, permit_1)?;
        }

        evm::log(events::UpdatePositionLiquidity {
            id,
            token0: token_0,
            token1: token_1,
        });

        Ok((token_0, token_1))
    }

    #[allow(clippy::too_many_arguments)]
    pub fn adjust_position_internal(
        &mut self,
        pool: Address,
        id: U256,
        amount_0_min: U256,
        amount_1_min: U256,
        amount_0_desired: U256,
        amount_1_desired: U256,
        giving: bool,
        permit2: Option<(Permit2Args, Permit2Args)>,
    ) -> Result<(U256, U256), Revert> {
        assert_eq_or!(
            msg::sender(),
            self.position_owners.get(id),
            Error::PositionOwnerOnly
        );

        let (amount_0, amount_1) = self.pools.setter(pool).adjust_position(
            id,
            amount_0_desired,
            amount_1_desired,
            giving,
        )?;

        evm::log(events::UpdatePositionLiquidity {
            id,
            token0: amount_0,
            token1: amount_1,
        });

        #[cfg(feature = "testing-dbg")]
        dbg!((
            "adjust position before conversion",
            current_test!(),
            giving,
            amount_0.to_string(),
            amount_1.to_string(),
            amount_0_min.to_string(),
            amount_1_min.to_string(),
            amount_0_desired.to_string(),
            amount_1_desired.to_string(),
        ));

        let (amount_0, amount_1) = if giving {
            #[cfg(feature = "testing-dbg")]
            {
                if amount_0 > I256::zero() {
                    dbg!((
                        "amount_0 > 0 (abs neg failed!)",
                        current_test!(),
                        amount_0.to_string(),
                    ));
                }
                if amount_1 > I256::zero() {
                    dbg!((
                        "amount_1 > 0 (abs neg failed!)",
                        current_test!(),
                        amount_1.to_string(),
                    ));
                }
            }
            (amount_0.abs_neg()?, amount_1.abs_neg()?)
        } else {
            #[cfg(feature = "testing-dbg")]
            {
                if amount_0 < I256::zero() {
                    dbg!((
                        "amount_0 < 0 (abs pos failed!)",
                        current_test!(),
                        amount_0.to_string(),
                    ));
                }
                if amount_1 < I256::zero() {
                    dbg!((
                        "amount_1 < 0 (abs pos failed!)",
                        current_test!(),
                        amount_1.to_string(),
                    ));
                }
            }
            (amount_0.abs_pos()?, amount_1.abs_pos()?)
        };

        #[cfg(feature = "testing-dbg")]
        {
            if amount_0 < amount_0_min {
                dbg!((
                    "amount 0 < amount 0 min",
                    current_test!(),
                    amount_0.to_string(),
                    amount_0_min.to_string()
                ));
            }
            if amount_1 < amount_1_min {
                dbg!((
                    "amount 1 < amount 1 min",
                    current_test!(),
                    amount_1.to_string(),
                    amount_1_min.to_string()
                ));
            }
        }

        #[cfg(feature = "testing-dbg")]
        dbg!((
            "amounts",
            current_test!(),
            amount_0.to_string(),
            amount_1.to_string(),
            amount_0_desired.to_string(),
            amount_1_desired.to_string()
        ));

        #[cfg(feature = "testing-dbg")]
        {
            if amount_0 > amount_0_desired {
                dbg!((
                    "amount 0 > amount 0 desired",
                    current_test!(),
                    amount_0.to_string(),
                    amount_0_desired.to_string()
                ));
            }
            if amount_1 > amount_1_desired {
                dbg!((
                    "amount 1 > amount 1 desired",
                    current_test!(),
                    amount_1.to_string(),
                    amount_1_desired.to_string()
                ));
            }
        }

        assert_or!(amount_0 >= amount_0_min, Error::LiqResultTooLow);
        assert_or!(amount_1 >= amount_1_min, Error::LiqResultTooLow);

        #[cfg(feature = "testing-dbg")]
        dbg!((
            "adjust position after conversion",
            current_test!(),
            amount_0,
            amount_1,
            amount_0_min,
            amount_1_min,
            amount_0_desired,
            amount_1_desired,
            giving
        ));

        if giving {
            erc20::transfer_to_sender(pool, amount_0)?;
            erc20::transfer_to_sender(FUSDC_ADDR, amount_1)?;
        } else {
            let (permit_0, permit_1) = match permit2 {
                Some((permit_0, permit_1)) => (Some(permit_0), Some(permit_1)),
                None => (None, None),
            };

            erc20::take(pool, amount_0, permit_0)?;
            erc20::take(FUSDC_ADDR, amount_1, permit_1)?;
        }

        Ok((amount_0, amount_1))
    }
}

#[cfg_attr(feature = "update_positions", external)]
impl Pools {
    /// Refreshes and updates liquidity in a position, using approvals to transfer tokens.
    /// See [Self::update_position_internal].
    #[allow(non_snake_case)]
    pub fn update_position_C_7_F_1_F_740(
        &mut self,
        pool: Address,
        id: U256,
        delta: i128,
    ) -> Result<(I256, I256), Revert> {
        self.update_position_internal(pool, id, delta, None)
    }

    /// Refreshes and updates liquidity in a position, transferring tokens from the user with a restriction on the amount taken.
    /// See [Self::adjust_position_internal].
    #[allow(non_snake_case)]
    pub fn incr_position_C_3_A_C_7_C_A_A(
        &mut self,
        pool: Address,
        id: U256,
        amount_0_min: U256,
        amount_1_min: U256,
        amount_0_desired: U256,
        amount_1_desired: U256,
    ) -> Result<(U256, U256), Revert> {
        self.adjust_position_internal(
            pool,
            id,
            amount_0_min,
            amount_1_min,
            amount_0_desired,
            amount_1_desired,
            false,
            None,
        )
    }

    /// Refreshes and updates liquidity in a position, transferring tokens to the user with restrictions.
    /// See [Self::adjust_position_internal].
    #[allow(non_snake_case)]
    pub fn decr_position_09293696(
        &mut self,
        pool: Address,
        id: U256,
        amount_0_min: U256,
        amount_1_min: U256,
        amount_0_max: U256,
        amount_1_max: U256,
    ) -> Result<(U256, U256), Revert> {
        self.adjust_position_internal(
            pool,
            id,
            amount_0_min,
            amount_1_min,
            amount_0_max,
            amount_1_max,
            true,
            None,
        )
    }
}

/// Admin functions. Only enabled when the `admin` feature is set.
#[cfg_attr(feature = "admin", external)]
impl Pools {
    /// The initialiser function for the seawater contract. Should be called in the proxy's
    /// constructor.
    ///
    ///  # Errors
    ///  Requires the contract to not be initialised.
    pub fn ctor(
        &mut self,
        seawater_admin: Address,
        nft_manager: Address,
        emergency_council: Address,
    ) -> Result<(), Revert> {
        assert_eq_or!(
            self.seawater_admin.get(),
            Address::ZERO,
            Error::ContractAlreadyInitialised
        );

        self.seawater_admin.set(seawater_admin);
        self.nft_manager.set(nft_manager);
        self.emergency_council.set(emergency_council);

        Ok(())
    }

    /// Creates a new pool. Only usable by the seawater admin.
    ///
    /// # Arguments
    /// * `pool` - The address of the non-fluid token to construct the pool around.
    /// * `price` - The initial price for the pool, as an X96 encoded square root price.
    /// * `fee` - The fee for the pool.
    /// * `tick_spacing` - The tick spacing for the pool.
    /// * `max_liquidity_per_tick` - The maximum amount of liquidity allowed in a single tick.
    ///
    /// # Errors
    /// Requires the caller to be the seawater admin. Requires the pool to not exist.
    #[allow(non_snake_case)]
    pub fn create_pool_D650_E2_D0(
        &mut self,
        pool: Address,
        price: U256,
        fee: u32,
        tick_spacing: u8,
        max_liquidity_per_tick: u128,
    ) -> Result<(), Revert> {
        assert_eq_or!(
            msg::sender(),
            self.seawater_admin.get(),
            Error::SeawaterAdminOnly
        );

        self.pools
            .setter(pool)
            .init(price, fee, tick_spacing, max_liquidity_per_tick)?;

        // get the decimals for the asset so we can log it's decimals for the indexer

        let decimals = erc20::decimals(pool)?;

        evm::log(events::NewPool {
            token: pool,
            fee,
            decimals,
            tickSpacing: tick_spacing,
        });

        Ok(())
    }

    /// Getter method for the sqrt price
    #[allow(non_snake_case)]
    pub fn sqrt_price_x967_B8_F5_F_C5(&self, pool: Address) -> Result<U256, Revert> {
        Ok(self.pools.getter(pool).get_sqrt_price())
    }

    /// Getter method for the current tick
    #[allow(non_snake_case)]
    pub fn cur_tick181_C6_F_D9(&self, pool: Address) -> Result<i32, Revert> {
        // converted to i32 for automatic abi encoding
        Ok(self.pools.getter(pool).get_cur_tick().sys())
    }

    #[allow(non_snake_case)]
    pub fn fees_owed_22_F28_D_B_D(&self, pool: Address, id: U256) -> Result<(u128, u128), Revert> {
        Ok(self.pools.getter(pool).get_fees_owed(id))
    }

    /// Getter method for the tick spacing of the pool given.
    #[allow(non_snake_case)]
    pub fn tick_spacing_653_F_E28_F(&self, pool: Address) -> Result<u8, Revert> {
        // converted to i32 for automatic abi encoding
        Ok(self.pools.getter(pool).get_tick_spacing().sys())
    }

    #[allow(non_snake_case)]
    pub fn fee_B_B_3_C_F_608(&self, pool: Address) -> Result<u32, Revert> {
        Ok(self.pools.getter(pool).get_fee())
    }

    /// Getter method for getting the fee growth for token 0
    #[allow(non_snake_case)]
    pub fn fee_growth_global_0_38_B5665_B(&self, pool: Address) -> Result<U256, Revert> {
        Ok(self.pools.getter(pool).get_fee_growth_global_0())
    }

    /// Getter method for getting the fee growth for token 1
    #[allow(non_snake_case)]
    pub fn fee_growth_global_1_A_33_A_5_A_1_B(&self, pool: Address) -> Result<U256, Revert> {
        Ok(self.pools.getter(pool).get_fee_growth_global_1())
    }

    /// Set the sqrt price for a pool. Only useful if the pool was
    /// misconfigured (intentionally or otherwise) at the beginning of the
    /// pool's life. Be careful with this!
    #[allow(non_snake_case)]
    pub fn set_sqrt_price_F_F_4_D_B_98_C(
        &mut self,
        pool: Address,
        new_price: U256,
    ) -> Result<(), Revert> {
        assert_eq_or!(
            msg::sender(),
            self.seawater_admin.get(),
            Error::SeawaterAdminOnly
        );

        self.pools.setter(pool).set_sqrt_price(new_price);

        Ok(())
    }

    /// Update the NFT manager that has trusted access to moving tokens on
    /// behalf of users.
    #[allow(non_snake_case)]
    pub fn update_nft_manager_9_B_D_F_41_F_6(&mut self, manager: Address) -> Result<(), Revert> {
        assert_eq_or!(
            msg::sender(),
            self.seawater_admin.get(),
            Error::SeawaterAdminOnly
        );

        self.nft_manager.set(manager);

        Ok(())
    }

    /// Update the emergency council that can disable the pools.
    #[allow(non_snake_case)]
    pub fn update_emergency_council_7_D_0_C_1_C_58(
        &mut self,
        manager: Address,
    ) -> Result<(), Revert> {
        assert_eq_or!(
            msg::sender(),
            self.seawater_admin.get(),
            Error::SeawaterAdminOnly
        );

        self.nft_manager.set(manager);

        Ok(())
    }

    /// Collects protocol fees from the AMM. Only usable by the seawater admin.
    ///
    /// # Errors
    /// Requires the user to be the seawater admin. Requires the pool to be enabled.
    #[allow(non_snake_case)]
    pub fn collect_protocol_7540_F_A_9_F(
        &mut self,
        pool: Address,
        amount_0: u128,
        amount_1: u128,
        recipient: Address,
    ) -> Result<(u128, u128), Revert> {
        assert_eq_or!(
            msg::sender(),
            self.seawater_admin.get(),
            Error::SeawaterAdminOnly
        );

        let (token_0, token_1) = self
            .pools
            .setter(pool)
            .collect_protocol(amount_0, amount_1)?;

        erc20::transfer_to_addr(recipient, pool, U256::from(token_0))?;
        erc20::transfer_to_addr(recipient, FUSDC_ADDR, U256::from(token_1))?;

        evm::log(events::CollectProtocolFees {
            pool,
            to: recipient,
            amount0: token_0,
            amount1: token_1,
        });

        // transfer tokens
        Ok((token_0, token_1))
    }

    /// Changes if a pool is enabled. Only usable by the seawater admin, or the emergency council, or the
    ///
    /// # Errors
    /// Requires the user to be the seawater admin.
    #[allow(non_snake_case)]
    pub fn enable_pool_579_D_A658(&mut self, pool: Address, enabled: bool) -> Result<(), Revert> {
        assert_or!(
            self.seawater_admin.get() == msg::sender()
                || self.emergency_council.get() == msg::sender()
                || self.authorised_enablers.get(msg::sender()),
            Error::SeawaterAdminOnly
        );

        if self.emergency_council.get() == msg::sender()
            && self.seawater_admin.get() != msg::sender()
            && enabled
        {
            // Emergency council can only disable!
            return Err(Error::SeawaterEmergencyOnlyDisable.into());
        }

        self.pools.setter(pool).set_enabled(enabled);
        Ok(())
    }

    #[allow(non_snake_case)]
    pub fn authorise_enabler_5_B_17_C_274(
        &mut self,
        enabler: Address,
        enabled: bool,
    ) -> Result<(), Revert> {
        assert_or!(
            self.seawater_admin.get() == msg::sender(),
            Error::SeawaterAdminOnly
        );

        self.authorised_enablers.setter(enabler).set(enabled);

        Ok(())
    }
}

///! Migrations code that should only be used in a testing environment, or in a rescue
///! situation. These functions will break the internal state of the pool most likely.
#[cfg_attr(feature = "migrations", external)]
impl Pools {
    pub fn disable_pools(&mut self, pools: Vec<Address>) -> Result<(), Vec<u8>> {
        assert_eq_or!(
            msg::sender(),
            self.seawater_admin.get(),
            Error::SeawaterAdminOnly
        );

        for pool in pools {
            self.pools.setter(pool).set_enabled(false);
        }

        Ok(())
    }

    pub fn send_token_to_sender(&mut self, token: Address, amount: U256) -> Result<(), Vec<u8>> {
        assert_eq_or!(
            msg::sender(),
            self.seawater_admin.get(),
            Error::SeawaterAdminOnly
        );

        erc20::transfer_to_sender(token, amount)?;

        Ok(())
    }

    pub fn send_amounts_from_sender(
        &mut self,
        token: Address,
        recipient_addrs: Vec<Address>,
        recipient_amounts: Vec<U256>,
    ) -> Result<(), Revert> {
        assert_eq_or!(
            msg::sender(),
            self.seawater_admin.get(),
            Error::SeawaterAdminOnly
        );

        for (addr, amount) in recipient_addrs.iter().zip(recipient_amounts.iter()) {
            erc20::take_from_to(token, *addr, *amount)?;
        }

        Ok(())
    }
}

#[cfg(all(not(target_arch = "wasm32"), feature = "testing"))]
impl test_utils::StorageNew for Pools {
    fn new(i: U256, v: u8) -> Self {
        unsafe { <Self as stylus_sdk::storage::StorageType>::new(i, v) }
    }
}
