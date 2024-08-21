//! # seawater
//!
//! `seawater` is the binary crate for the seawater AMM.
//!
//! This crate is just a thin shim around [libseawater]. `seawater` is
//! implemented as a library crate to make it easier to test, but
//! `cargo stylus` needs a binary crate in order to work properly.
//! See that crate for docs.

#![cfg_attr(target_arch = "wasm32", no_main, no_std)]

use libseawater::user_entrypoint as stylus_entrypoint;

/// Stylus entrypoint for `seawater`
///
/// Reexport of [libseawater's entrypoint](libseawater::user_entrypoint).
pub extern "C" fn user_entrypoint(len: usize) -> usize {
    stylus_entrypoint(len)
}

// for whatever reason this needs to be set or else tests won't build, even without no_main
#[cfg(not(target_arch = "wasm32"))]
#[doc(hidden)]
fn main() {}
