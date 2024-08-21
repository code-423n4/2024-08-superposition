//! ERC20 functions, including taking, sending, and taking using
//! permit2. Platform-dependent and optionally mocked out, if tests are
//! enabled.

#[cfg(target_arch = "wasm32")]
pub use crate::wasm_erc20::*;

#[cfg(all(not(target_arch = "wasm32"), feature = "testing"))]
pub use crate::host_erc20::*;

pub use crate::permit2_types::*;
