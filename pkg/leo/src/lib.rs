#![feature(split_array)]
#![allow(unused_variables)]

use stylus_sdk::{
    alloy_primitives::{aliases::*, *},
    block, evm, msg,
    prelude::*,
    storage::*,
};

pub mod calldata;
pub mod erc20;
pub mod error;
pub mod events;
pub mod maths;
pub mod nft_manager;
pub mod seawater;

mod immutables;

#[cfg(not(target_arch = "wasm32"))]
pub mod host;

use error::Error;

extern crate alloc;
#[cfg(target_arch = "wasm32")]
mod allocator {
    use lol_alloc::{AssumeSingleThreaded, FreeListAllocator};
    // SAFETY: This application is single threaded, so using AssumeSingleThreaded is allowed.
    #[global_allocator]
    static ALLOCATOR: AssumeSingleThreaded<FreeListAllocator> =
        unsafe { AssumeSingleThreaded::new(FreeListAllocator::new()) };
}

type CampaignId = FixedBytes<8>;

#[solidity_storage]
#[entrypoint]
pub struct Leo {
    version: StorageU8,

    enabled: StorageBool,

    emergency_council: StorageAddress,

    // pool => campaign id => campaign[]
    campaigns: StorageMap<Address, StorageCampaigns>,

    // campaign id => campaign balance
    campaign_balances: StorageMap<CampaignId, StorageCampaignBal>,

    // position id => position
    positions: StorageMap<U256, StoragePosition>,

    // pool address => LP token count
    liquidity: StorageMap<Address, StorageU256>,
}

#[solidity_storage]
pub struct StorageCampaigns {
    // Ongoing campaigns. We don't use a map since the seconds will
    // default to 0 so it'll return 0 for amounts calculated.
    ongoing: StorageMap<CampaignId, StorageVec<StorageCampaign>>,
}

#[solidity_storage]
pub struct StorageCampaignBal {
    // Owner of the campaign balance so we don't have any abuse.
    owner: StorageAddress,

    // Token being distributed.
    token: StorageAddress,

    // Amount that can be distributed.
    maximum: StorageU256,

    // Amount that was already distributed.
    distributed: StorageU256,
}

#[solidity_storage]
pub struct StorageCampaign {
    // The lower tick that the position should be LP'd in for them to be eligible.
    tick_lower: StorageI32,

    // The upper tick that the position should be LP'd in for eligibility.
    tick_upper: StorageI32,

    // Amount of token emitted per second.
    per_second: StorageU256,

    // The timestamp of when this campaign is starting.
    starting: StorageU64,

    // The timestamp of when this campaign ended. May be modified
    // if updates are made to the existing campaign.
    ending: StorageU64,
}

#[solidity_storage]
pub struct StoragePosition {
    owner: StorageAddress,

    // Internal state of the user's timestamp position.
    timestamp: StorageU64,

    token: StorageAddress,

    tick_lower: StorageI32,
    tick_upper: StorageI32,

    liquidity: StorageU256,

    // Indexes of the position of the current status per campaign that's updated
    offsets: StorageMap<CampaignId, StorageU256>,
}

#[external]
impl Leo {
    pub fn ctor(&mut self, emergency: Address) -> Result<(), Vec<u8>> {
        assert_or!(self.version.get().is_zero(), Error::AlreadySetUp);
        self.emergency_council.set(emergency);
        self.version.set(U8::from(1));
        self.enabled.set(true);
        Ok(())
    }

    // Take a user's LP NFT using the NFT Manager, also recording the
    // pool they LP'd, including the timestamp when they deposited it
    // here. This also serves as the time it was last updated.
    pub fn vest_position(&mut self, pool: Address, id: U256) -> Result<(), Vec<u8>> {
        // Just to be safe, check if we already have this position tracked.
        assert_or!(
            self.positions.get(id).timestamp.get().is_zero(),
            Error::PositionAlreadyExists
        );

        let position_liq = seawater::position_liquidity(pool, id);
        assert_or!(!position_liq.is_zero(), Error::PositionHasNoLiquidity);

        nft_manager::take_position(id);

        // Start to set everything related to the position.
        let mut position = self.positions.setter(id);
        position.owner.set(msg::sender());
        position.timestamp.set(U64::from(block::timestamp()));
        position.token.set(pool);
        position.tick_lower.set(seawater::tick_lower(pool, id));
        position.tick_upper.set(seawater::tick_upper(pool, id));

        // Also increase the global count for LP available for this pool.
        position.liquidity.set(position_liq);
        let existing_liq = self.liquidity.getter(pool).get();
        self.liquidity
            .setter(pool)
            .set(existing_liq + U256::from(position_liq));
        Ok(())
    }

    // Create a campaign, setting its current iteration to these parameters,
    // taking the maximum balance of tokens to distribute into this
    // contract for later distribution.
    pub fn create_campaign(
        &mut self,
        identifier: CampaignId,
        pool: Address,
        tick_lower: i32,
        tick_upper: i32,
        per_second: U256,
        token: Address,
        extra_max: U256,
        starting: u64,
        ending: u64,
    ) -> Result<(), Vec<u8>> {
        assert_or!(self.enabled.get(), Error::NotEnabled);

        // Sanity checks to prevent junk campaigns from being made.
        assert_or!(!per_second.is_zero(), Error::BadCampaignConfig);

        // Take the ERC20 from the user for the maximum run of the campaign.
        let mut pool_campaigns = self.campaigns.setter(pool);
        let mut pool_campaigns_ongoing = pool_campaigns.ongoing.setter(identifier);

        // Make sure this campaign doesn't exist already.
        assert_or!(
            pool_campaigns_ongoing.is_empty(),
            Error::CampaignAlreadyExists
        );

        let mut campaign = pool_campaigns_ongoing.grow();

        // Make sure the sender owns the campaign balance.
        let campaign_bal_owner = self.campaign_balances.getter(identifier).owner.get();
        assert_or!(campaign_bal_owner == msg::sender(), Error::NotCampaignOwner);

        // Set everything related to the pool.
        campaign
            .tick_lower
            .set(I32::from_le_bytes(tick_lower.to_le_bytes()));
        campaign
            .tick_upper
            .set(I32::from_le_bytes(tick_upper.to_le_bytes()));
        campaign.per_second.set(per_second);
        campaign
            .starting
            .set(U64::from_le_bytes(starting.to_le_bytes()));
        campaign
            .ending
            .set(U64::from_le_bytes(ending.to_le_bytes()));

        let mut campaign_bal = self.campaign_balances.setter(identifier);
        campaign_bal.owner.set(msg::sender());
        campaign_bal.token.set(token);

        if !extra_max.is_zero() {
            let existing_maximum = campaign_bal.maximum.get();
            let new_maximum = existing_maximum + extra_max;
            campaign_bal.maximum.set(new_maximum);

            // Take the token's amounts for the campaign.
            erc20::take(pool, extra_max)?;

            evm::log(events::CampaignBalanceUpdated {
                identifier: identifier.as_slice().try_into().unwrap(),
                newMaximum: new_maximum,
            });
        }

        // Pack the words for CampaignCreated, and then emit that event.
        events::emit_campaign_created(
            identifier,
            pool,
            token,
            msg::sender(),
            tick_lower,
            tick_upper,
            starting,
            ending,
        );

        Ok(())
    }

    /// Update a campaign by taking the last campaign versions item, and
    /// setting the ending timestamp to the current timestamp, then inserting
    /// a new record to the campaign versions array with the settings we
    /// requested. Allows 0 to be provided, which is the equivalent of
    /// cancelling the campaign if it's provided, except as starting, though
    /// ending is checked to be 0, and if it is, then [update_position] won't
    /// work.
    pub fn update_campaign(
        &mut self,
        identifier: CampaignId,
        pool: Address,
        tick_lower: i32,
        tick_upper: i32,
        per_second: U256,
        extra_max: U256,
        starting: u64,
        ending: u64,
    ) -> Result<(), Vec<u8>> {
        assert_or!(self.enabled.get(), Error::NotEnabled);

        // Make sure we're the actual owner of the campaign globally!
        assert_eq!(
            self.campaign_balances.getter(identifier).owner.get(),
            msg::sender()
        );
        assert_or!(!per_second.is_zero(), Error::BadCampaignConfig);
        assert_or!(starting >= block::timestamp(), Error::BadCampaignConfig);
        assert_or!(ending > block::timestamp(), Error::BadCampaignConfig);

        // Push to the campaign versions the new content, setting the previous
        // campaign's ending timestamp to the current timestamp.
        let ongoing_campaigns = &mut self.campaigns.setter(pool).ongoing;
        let mut campaign_versions = ongoing_campaigns.setter(identifier);
        let campaign_versions_len = campaign_versions.len();
        assert_or!(!campaign_versions.is_empty(), Error::NoCampaign);
        campaign_versions
            .setter(campaign_versions_len - 1)
            .unwrap()
            .ending
            .set(U64::from(block::timestamp()));
        let mut campaign = campaign_versions.grow();
        campaign
            .tick_lower
            .set(I32::from_le_bytes(tick_lower.to_le_bytes()));
        campaign
            .tick_upper
            .set(I32::from_le_bytes(tick_upper.to_le_bytes()));
        campaign.per_second.set(per_second);
        campaign
            .starting
            .set(U64::from_le_bytes(starting.to_le_bytes()));
        campaign
            .ending
            .set(U64::from_le_bytes(ending.to_le_bytes()));

        if !extra_max.is_zero() {
            let mut campaign_bal = self.campaign_balances.setter(identifier);
            let existing_maximum = campaign_bal.maximum.get();
            let new_maximum = existing_maximum + extra_max;
            campaign_bal.maximum.set(new_maximum);

            // Take the token's amounts for the campaign.
            erc20::take(pool, extra_max)?;

            evm::log(events::CampaignBalanceUpdated {
                identifier: identifier.as_slice().try_into().unwrap(),
                newMaximum: new_maximum,
            });
        }

        events::emit_campaign_updated(
            identifier, pool, per_second, tick_lower, tick_upper, starting, ending,
        );

        Ok(())
    }

    pub fn cancel_campaign(
        &mut self,
        pool: Address,
        identifier: CampaignId,
    ) -> Result<(), Vec<u8>> {
        assert_or!(self.enabled.get(), Error::NotEnabled);
        assert_eq!(
            self.campaign_balances.getter(identifier).owner.get(),
            msg::sender()
        );
        let ongoing_campaigns = &mut self.campaigns.setter(pool).ongoing;
        let mut campaign_versions = ongoing_campaigns.setter(identifier);
        let campaign_versions_len = campaign_versions.len();
        assert_or!(!campaign_versions.is_empty(), Error::NoCampaign);
        campaign_versions
            .setter(campaign_versions_len - 1)
            .unwrap()
            .ending
            .set(U64::from(block::timestamp()));
        campaign_versions.grow(); // Grow with an empty value so it's 0 for all!
        events::emit_campaign_updated(identifier, pool, U256::ZERO, 0, 0, 0, 0);
        Ok(())
    }

    /// Return campaign details, of the form the lower tick, the upper tick,
    /// the amount sent per second in the campaign, the token that's being
    /// distributed, and the amount distributed so far, as well as the maximum
    /// amount, and the starting and ending timestamp.
    pub fn campaign_details(
        &self,
        pool: Address,
        id: CampaignId,
    ) -> Result<(i32, i32, U256, Address, U256, U256, u64, u64), Vec<u8>> {
        let len = self.campaigns.getter(pool).ongoing.getter(id).len();
        assert_or!(len > 0, Error::NoCampaign);
        let campaigns = self.campaigns.getter(pool);
        let campaigns_ongoing = &campaigns.ongoing.getter(id);
        let campaign = campaigns_ongoing.getter(len - 1).unwrap();
        let campaign_bal = self.campaign_balances.getter(id);
        Ok((
            i32::from_le_bytes(campaign.tick_lower.get().to_le_bytes()),
            i32::from_le_bytes(campaign.tick_upper.get().to_le_bytes()),
            campaign.per_second.get(),
            campaign_bal.token.get(),
            campaign_bal.distributed.get(),
            campaign_bal.maximum.get(),
            u64::from_le_bytes(campaign.starting.get().to_le_bytes()),
            u64::from_le_bytes(campaign.ending.get().to_le_bytes()),
        ))
    }

    pub fn pool_lp(&self, pool: Address) -> Result<U256, Vec<u8>> {
        Ok(self.liquidity.getter(pool).get())
    }

    // Collect the token rewards paid by Seawater for LP'ing in this
    // position, then send to the user.
    pub fn collect_pool_rewards(&self, pool: Address, id: U256) -> Result<(u128, u128), Vec<u8>> {
        assert_or!(self.enabled.get(), Error::NotEnabled);
        assert_or!(
            self.positions.get(id).owner.get() == msg::sender(),
            Error::NotPositionOwner
        );
        let (amount_0, amount_1) = seawater::collect_yield_single_to(id, pool, msg::sender());
        Ok((amount_0, amount_1))
    }

    // Return the LP rewards paid by Leo for vesting this NFT position.
    // Update the current position of the user per campaign that's
    // ongoing, and send them rewards using the time that was spent in
    // each campaign setting before the update occured. An update to a
    // campaign is tracked by updating its end date to earlier so the lp
    // rewards code attempts to roll over. In doing so, update the
    // timestamp to reset the rewards they've earned so far, and set them
    // to the latest version of each campaign update.
    pub fn collect_lp_rewards(
        &mut self,
        pool: Address,
        position_id: U256,
        campaign_ids: Vec<CampaignId>,
    ) -> Result<Vec<(Address, U256)>, Vec<u8>> {
        assert_or!(self.enabled.get(), Error::NotEnabled);
        assert_or!(
            self.positions.getter(position_id).owner.get() == msg::sender(),
            Error::NotPositionOwner
        );

        // Iterate through every copy of the campaign details until we pass the ending.
        let mut position = self.positions.setter(position_id);
        let position_tick_lower = position.tick_lower.get();
        let position_tick_upper = position.tick_upper.get();
        let position_liquidity = position.liquidity.get();

        let position_token = position.token.get();

        // Track amounts owed to this array to return.
        let mut owed = Vec::new();

        for campaign_id in campaign_ids {
            let offsets = position.offsets.getter(campaign_id);
            let mut offset = offsets.get();
            let campaigns = &self.campaigns;
            let campaigns_ongoing = &campaigns.getter(pool).ongoing;
            let campaign_versions = campaigns_ongoing.getter(campaign_id);

            let campaign_bal = self.campaign_balances.getter(campaign_id);
            let campaign_token = campaign_bal.token.get();
            let campaign_maximum = campaign_bal.maximum.get();

            // Weird issues could come up if the campaign maximum is empty.
            assert_or!(campaign_maximum > U256::ZERO, Error::CampaignMaxEmpty);

            // The amount distributed in this campaign, mutable in a way that
            // lets us set it later.
            let mut distributed = self.campaign_balances.setter(campaign_id).distributed.get();

            let mut cur_timestamp = U64::from(block::timestamp());

            loop {
                eprintln!("offset: {offset}, cur timestamp: {cur_timestamp}");

                let campaign_updates = campaign_versions.getter(offset);

                eprintln!("campaign offset is some? {}", campaign_updates.is_some());

                if campaign_updates.is_none() {
                    break;
                }

                let campaign = campaign_updates.unwrap();

                let campaign_starting = campaign.starting.get();
                let campaign_ending = campaign.ending.get();

                eprintln!("campaign starting offset {offset}, starting: {campaign_starting}, ending {campaign_ending}, current timestamp: {}", block::timestamp());

                if campaign_ending.is_zero() {
                    // We should terminate, the campaign was cancelled.
                    break;
                }

                // If we've exceeded or are equal to the ending date of
                // the campaign, we assume it's finished.
                if cur_timestamp >= campaign_ending {
                    offset += U256::from(1);
                    continue;
                }

                // Set the timestamp to either the ending timestamp for the current campaign,
                // or the block timestamp.
                let clamped_timestamp = U64::min(campaign_ending, cur_timestamp);

                // If this campaign hasn't started, we need to terminate so the user can wait.
                if clamped_timestamp < campaign_starting {
                    break;
                }

                // Go to the next campaign iteration, hoping that an update might take place
                // that makes the user eligible.
                let should_skip = position_tick_lower < campaign.tick_lower.get()
                    || position_tick_upper > campaign.tick_upper.get();
                if should_skip {
                    eprintln!("sholud skip?");
                    offset += U256::from(1);
                    continue;
                }

                // Since we're continuing, we figure out what the user is owed, and we set the
                // timestamp to the ending of this campaign.
                let clamped_secs_since = clamped_timestamp - campaign_starting;

                if clamped_secs_since <= U64::ZERO {
                    break;
                }

                eprintln!(
                    "pool lp: {}, position liquidity: {position_liquidity}, campaign per sec: {}, secs since {clamped_secs_since}, campaign starting: {campaign_starting}, current timestamp: {cur_timestamp}",
                    self.liquidity.getter(pool).get(),
                    campaign.per_second.get(),
                );

                let base_rewards = maths::calc_base_rewards(
                    self.liquidity.getter(pool).get(), // Pool LP
                    position_liquidity,                // User LP
                    campaign.per_second.get(),         // Campaign rewards per sec
                );

                let rewards = base_rewards * U256::from(clamped_secs_since);
                owed.push((campaign_token, rewards));

                // Use the minimum of the existing current timestamp or the ending timestamp.
                cur_timestamp = clamped_timestamp;
                distributed += rewards;

                // Extra protection incase we blow past the amount that should be allocated somehow.
                assert_or!(
                    distributed < self.campaign_balances.getter(campaign_id).maximum.get(),
                    Error::CampaignDistributedCompletely
                );

                // Since we made it to the end of this campaign for now, break out.
                break;
            }

            // Update the position's tracked last claim timestamp.
            position.timestamp.set(U64::from(block::timestamp()));

            // Update what we've sent out so far!
            self.campaign_balances
                .setter(campaign_id)
                .distributed
                .set(distributed);
        }

        Ok(owed)
    }

    // Divest LP positions from this contract, sending them back to the
    // original owner.
    pub fn divest_position(
        &mut self,
        pool: Address,
        position_id: U256,
        campaigns: Vec<CampaignId>,
    ) -> Result<(), Vec<u8>> {
        assert_or!(self.enabled.get(), Error::NotEnabled);
        // Check if the user owns this position. Do this even though the
        // claim LP function would do this, just incase they pass zero campaigns.
        assert_or!(
            self.positions.getter(position_id).owner.get() == msg::sender(),
            Error::NotPositionOwner
        );
        self.collect_lp_rewards(pool, position_id, campaigns)?;
        // This should be enough to zero out the position.
        self.positions.setter(position_id).owner.set(Address::ZERO);
        let existing_liq = self.liquidity.getter(pool).get();
        self.liquidity
            .setter(pool)
            .set(existing_liq - self.positions.getter(position_id).liquidity.get());
        nft_manager::give_position(position_id);
        Ok(())
    }

    #[cfg(all(feature = "testing", not(target_arch = "wasm32")))]
    pub fn admin_reduce_pos_time(&mut self, id: U256, secs: u64) -> Result<(), Vec<u8>> {
        let ts = self.positions.setter(id).timestamp.get();
        self.positions
            .setter(id)
            .timestamp
            .set(ts - U64::from(secs));
        Ok(())
    }

    #[cfg(all(feature = "testing", not(target_arch = "wasm32")))]
    pub fn admin_reduce_campaign_starting_last_iteration(
        &mut self,
        pool: Address,
        id: FixedBytes<8>,
        secs: u64,
    ) -> Result<(), Vec<u8>> {
        let campaigns = self.campaigns.getter(pool).ongoing.getter(id);
        let len = self.campaigns.getter(pool).ongoing.getter(id).len();
        let starting = self
            .campaigns
            .setter(pool)
            .ongoing
            .setter(id)
            .setter(len - 1)
            .unwrap()
            .starting
            .get();
        self.campaigns
            .setter(pool)
            .ongoing
            .setter(id)
            .setter(len - 1)
            .unwrap()
            .starting
            .set(starting - U64::from(secs));
        Ok(())
    }
}

pub trait StorageNew {
    fn new(i: U256, v: u8) -> Self;
}

impl StorageNew for Leo {
    fn new(i: U256, v: u8) -> Self {
        unsafe { <Self as stylus_sdk::storage::StorageType>::new(i, v) }
    }
}
