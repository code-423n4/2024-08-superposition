use alloc::vec::Vec;
use thiserror::Error;

/// Assert or macro taken from Seawater.
#[macro_export]
macro_rules! assert_or {
    ($cond:expr, $err:expr) => {
        if !($cond) {
            Err($err)?; // question mark forces coercion
        }
    };
}

#[derive(Error, Debug)]
#[repr(u8)]
pub enum Error {
    /// [ctor] failed, as the contract was already set up!
    // 0 (0x00)
    #[error("Contract was already set up!")]
    AlreadySetUp,

    /// The campaign wasn't configured correctly and has a zero pool.
    // 1 (0x01)
    #[error("Contract maximum is empty")]
    CampaignMaxEmpty,

    /// The campaign finished.
    // 2 (0x02)
    #[error("Campaign is finished")]
    CampaignFinished,

    /// This is an empty campaign!
    // 3 (0x03)
    #[error("Campaign is empty")]
    NoCampaign,

    /// Leo is disabled!
    // 4 (0x04)
    #[error("Leo is disabled")]
    NotEnabled,

    /// Sender is not the position owner!
    // 5 (0x05)
    #[error("Not position owner")]
    NotPositionOwner,

    /// Campaign is fully distributed!
    // 6 (0x06)
    #[error("Campaign is fully distributed")]
    CampaignDistributedCompletely,

    /// Position already exists.
    // 7 (0x07)
    #[error("Position already exists")]
    PositionAlreadyExists,

    /// Campaign configured incorrectly.
    // 8 (0x08)
    #[error("Campaign is misconfigured")]
    BadCampaignConfig,

    /// Campaign already exists.
    // 9 (0x09)
    #[error("Campaign already exists")]
    CampaignAlreadyExists,

    /// Not campaign owner.
    // 10 (0x0a)
    #[error("Sender is not the campaign owner")]
    NotCampaignOwner,

    /// Position is empty!
    // 11 (0x0b)
    #[error("Position has no liquidity!")]
    PositionHasNoLiquidity,
}

impl From<Error> for Vec<u8> {
    // tests return the message
    #[cfg(not(target_arch = "wasm32"))]
    fn from(val: Error) -> Self {
        val.to_string().into()
    }

    #[cfg(target_arch = "wasm32")]
    fn from(val: Error) -> Self {
        let id = unsafe { *<*const _>::from(&val).cast::<u8>() };
        let mut e = vec![id];
        e
    }
}
