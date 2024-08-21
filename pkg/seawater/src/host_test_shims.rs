//! Shim module to provide normally stylus-provided functions to link to in an unhosted
//! environment.
//!
//! Functions here are gated on tests, since normal contract execution should have the hosted
//! stylus environment.

use std::collections::HashMap;

use crate::{Address, U256};

#[allow(unused_imports)]
use crate::current_test;

#[no_mangle]
pub unsafe extern "C" fn native_keccak256(bytes: *const u8, len: usize, output: *mut u8) {
    // SAFETY
    // stylus promises `bytes` will have length `len`, `output` will have length one word
    use std::slice;
    use tiny_keccak::{Hasher, Keccak};

    let mut hasher = Keccak::v256();

    let data = unsafe { slice::from_raw_parts(bytes, len) };
    hasher.update(data);

    let output = unsafe { slice::from_raw_parts_mut(output, 32) };
    hasher.finalize(output);
}

pub mod storage {
    use std::cell::RefCell;
    use std::collections::HashMap;
    use std::ptr;

    use crate::{types::U256, Address};

    const WORD_BYTES: usize = 32;
    pub type Word = [u8; WORD_BYTES];
    pub type WordHashMap = HashMap<Word, Word>;

    thread_local! {
        pub static CURRENT_SENDER: RefCell<[u8; 20]> =
            const { RefCell::new([0; 20]) };

        pub static STORAGE: RefCell<WordHashMap> = RefCell::new(HashMap::new());

        pub static CALLER_BALS: RefCell<HashMap<Address, U256>> =
            RefCell::new(HashMap::new());

        pub static AMM_BALS: RefCell<HashMap<Address, U256>> =
            RefCell::new(HashMap::new());
    }

    pub unsafe fn read_word(key: *const u8) -> Word {
        let mut res = Word::default();
        ptr::copy(key, res.as_mut_ptr(), WORD_BYTES);
        res
    }

    pub unsafe fn write_word(key: *mut u8, val: Word) {
        ptr::copy(val.as_ptr(), key, WORD_BYTES);
    }
}

#[no_mangle]
pub unsafe extern "C" fn storage_store_bytes32(key: *const u8, value: *const u8) {
    let (key, value) = unsafe {
        // SAFETY - stylus insists these will both be valid words
        (storage::read_word(key), storage::read_word(value))
    };

    storage::STORAGE.with(|storage| storage.borrow_mut().insert(key, value));
}

#[no_mangle]
pub unsafe extern "C" fn storage_cache_bytes32(key: *const u8, value: *const u8) {
    // do the same as storage... for now. if the tests are more comprehensive
    // this may need to change.
    storage_store_bytes32(key, value);
}

#[no_mangle]
pub extern "C" fn storage_flush_cache(_clear: bool) {
    // do nothing
}

#[no_mangle]
pub unsafe extern "C" fn storage_load_bytes32(key: *const u8, out: *mut u8) {
    #[allow(unused_imports)]
    use crate::current_test;

    // SAFETY - stylus promises etc
    let key = unsafe { storage::read_word(key) };

    let value = storage::STORAGE.with(|storage| {
        storage
            .borrow()
            .get(&key)
            .map(storage::Word::to_owned)
            .unwrap_or_default()
    });

    #[cfg(feature = "testing-dbg")]
    dbg!((
        "read word",
        current_test!(),
        const_hex::const_encode::<32, false>(&key).as_str(),
        const_hex::const_encode::<32, false>(&value).as_str(),
    ));

    unsafe { storage::write_word(out, value) };
}

#[no_mangle]
pub unsafe extern "C" fn msg_sender(sender: *mut u8) {
    // copy the currently defined sender and return the pointer, or default
    let addr = storage::CURRENT_SENDER.with(|addr| *addr.borrow());

    #[cfg(feature = "testing-dbg")]
    dbg!((
        "read sender",
        current_test!(),
        const_hex::const_encode::<20, false>(&addr).as_str(),
    ));

    let b: *mut u8 = Box::into_raw(Box::new(addr)) as *mut _;

    std::ptr::copy(b, sender, 20);
}

#[no_mangle]
pub unsafe extern "C" fn emit_log(_pointer: *const u8, _len: usize, _: usize) {
    #[cfg(feature = "testing-dbg")]
    {
        let s = std::slice::from_raw_parts(_pointer, _len);
        dbg!(("log", current_test!(), const_hex::encode(s).as_str()));
    }
}

pub fn get_sender() -> [u8; 20] {
    storage::CURRENT_SENDER.with(|sender| *sender.borrow())
}

pub fn set_sender(new_sender: [u8; 20]) {
    storage::CURRENT_SENDER.with(|sender| *sender.borrow_mut() = new_sender);
}

pub fn set_caller_bals(items: HashMap<Address, U256>) {
    storage::CALLER_BALS.with(|sender| *sender.borrow_mut() = items);
}

pub fn set_amm_bals(items: HashMap<Address, U256>) {
    storage::AMM_BALS.with(|sender| *sender.borrow_mut() = items);
}

pub fn insert_word(key: storage::Word, value: storage::Word) {
    storage::STORAGE.with(|sender| sender.borrow_mut().insert(key, value));
}

pub fn reset_storage() {
    storage::STORAGE.with(|storage| storage.borrow_mut().clear());
    storage::CURRENT_SENDER.with(|sender| *sender.borrow_mut() = [0; 20]);
    storage::CALLER_BALS.with(|bals| bals.borrow_mut().clear());
    storage::AMM_BALS.with(|bals| bals.borrow_mut().clear());
}

pub fn take_caller_bal(token: Address, amt: U256) -> Result<(), U256> {
    storage::CALLER_BALS.with(|bals| match bals.borrow_mut().get_mut(&token) {
        Some(caller_bal) => {
            let (leftover, overflow) = caller_bal.overflowing_sub(amt);
            if overflow {
                Err(amt.checked_sub(*caller_bal).expect("No caller balance"))
            } else {
                *caller_bal = leftover;
                Ok(())
            }
        }
        _ => Ok(()),
    })
}

///! Take AMM balance at the address. If the index does not exist, assume the test is
///! permissive, and continue without issue.
pub fn take_amm_bal(token: Address, amt: U256) -> Result<(), U256> {
    storage::AMM_BALS.with(|bals| match bals.borrow_mut().get_mut(&token) {
        Some(amm_bal) => {
            let (leftover, overflow) = amm_bal.overflowing_sub(amt);
            if overflow {
                Err(amt
                    .checked_sub(*amm_bal)
                    .expect("Took balance from the amm"))
            } else {
                *amm_bal = leftover;
                Ok(())
            }
        }
        _ => Ok(()),
    })
}
