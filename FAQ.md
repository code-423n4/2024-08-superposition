
## End to end testing with a live instance isn't possible?

At the time of writing, the `cargo-stylus` toolchain is not verifying compiled blobs
correctly in our limited testing.

For now, tests will need to be run entirely in the testing suite without real-world
interaction, which is fine, since we have some functions that let you enforce
restrictions on the amount of ERC20 that's transferred around.

```rust
///! Set up the storage access, controlling for parallel use.
pub fn with_storage<T, P: StorageNew, F: FnOnce(&mut P) -> T>(
    sender: Option<[u8; 20]>,
    slots: Option<HashMap<&str, &str>>,
    caller_bals: Option<HashMap<Address, U256>>,
    amm_bals: Option<HashMap<Address, U256>>,
    f: F,
) -> T {
    StorageCache::clear();
    test_shims::reset_storage();
    if let Some(v) = sender {
        test_shims::set_sender(v);
    }
    if let Some(items) = caller_bals {
        test_shims::set_caller_bals(items);
    }
    if let Some(items) = amm_bals {
        test_shims::set_amm_bals(items);
    }
    if let Some(items) = slots {
        set_storage(items);
    }
    f(&mut P::new(U256::ZERO, 0))
}
```

You can create your own tests like such:

```rust
#[test]
fn alex_0f08c379a() -> Result<(), Vec<u8>> {
    test_utils::with_storage::<_, Pools, _>(
        Some(address!("feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5").into_array()),
        None,
        None, // Caller balances
        None, // AMM balances
        |contract| {
            // Your tests would live here!
        },
    )
}
```

## How do I run tests with debug logging/use a specific feature/run a specific test?

Run your tests like so:

	cargo test --features testing,testing-dbg,admin --package seawater -- ethers_suite_swapping_with_permit2_blobs_no_permit2 --nocapture

This would run tests with logging (with the feature `testing-dbg`), run only Seawater
(`seawater`), the specific test `ethers_suite_swapping_with_permit2_blobs_no_permit2`, and
it will log everything.

## Why do some (new) tests mysteriously fail with the wrong msg.sender when run alongside
everything else?

There's an issue we're aware of in our code involving how Stylus does caching behind the
scenes of the msg.sender. We haven't identified a fix. A solution for now is to run some
tests on their own if they use a different sender, or to use 0xfeb where possible.

## Why are some tests failing?

We left the failing test `incr_position_fee_growth_tick` as a a trailhead for any
researchers to understand whether they are symptomatic of a larger problem.

This is an issue that cropped up during testnet, though we're not fully sure as to whether
this is an issue caused by the original configuration of the contract (delta could be 0
during swaps).

We left `ethers_suite_orchestrated_uniswap_two` for investigators to determine if it's
also indicative of a broader issue. We haven't observed any weird behaviour in production.
