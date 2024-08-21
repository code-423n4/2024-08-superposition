//! Various utilities for encoding and decoding ethereum calldata.

/// Calculates a function's selector.
pub const fn selector(name: &[u8]) -> [u8; 4] {
    let hash = keccak_const::Keccak256::new().update(name).finalize();
    let mut result = [0_u8; 4];

    result[0] = hash[0];
    result[1] = hash[1];
    result[2] = hash[2];
    result[3] = hash[3];

    result
}

/// Extracts a 256 bit word from a data stream, returning the word and the remaining data.
pub fn take_word(data: &[u8]) -> (&[u8; 32], &[u8]) {
    #[allow(clippy::unwrap_used)]
    data.split_first_chunk::<32>().unwrap()
}

macro_rules! gen_parse {
    ($parsename:ident, $typename:ident, $type:ty, $bytes:expr, $ctor:expr) => {
        #[doc = "Parses a "]
        #[doc = concat!("[", stringify!($type), "]")]
        #[doc = " from a data stream, returning the parsed value and the remaining data."]
        pub fn $parsename(data: &[u8]) -> ($type, &[u8]) {
            let ($typename, data) = take_word(data);
            let (_, $typename) = $typename.rsplit_array_ref::<$bytes>();
            ($ctor, data)
        }
    };
}

macro_rules! gen_parse_int {
    ($parsename:ident, $int:ty) => {
        gen_parse!($parsename, num, $int, { <$int>::BITS as usize / 8 }, {
            <$int>::from_be_bytes(*num)
        });
    };
}

gen_parse!(
    parse_addr,
    address,
    crate::types::Address,
    20,
    crate::types::Address { 0: address.into() }
);
gen_parse!(
    parse_u256,
    u256,
    crate::types::U256,
    32,
    crate::types::U256::from_be_bytes::<32>(*u256)
);
gen_parse!(
    parse_i256,
    i256,
    crate::types::I256,
    32,
    crate::types::I256::from_be_bytes::<32>(*i256)
);
gen_parse!(parse_bool, val, bool, 1, val[0] != 0);

gen_parse_int!(parse_i32, i32);
gen_parse_int!(parse_i128, i128);

/// Extracts a 32 bit selector from a data stream, returning the selector and the remaining data.
pub fn parse_selector(data: &[u8]) -> (u32, &[u8]) {
    #[allow(clippy::unwrap_used)]
    let (selector, data) = data.split_first_chunk::<4>().unwrap();
    (u32::from_be_bytes(*selector), data)
}

/// Parses a series of bytes in ethereum encoding from a data stream, returning the bytes and the
/// remaining data.
///
/// # Encoding
/// Bytes are encoded in three parts - a placeholder, specifying the word offset of the bytes, and
/// then the length followed by the data encoded at the end of the blob.'
/// This function parses the second part - you should use [take_word] to remove the word offset
/// when you encounter it.
///
/// # Examples
///
/// ```
/// // test parsing calldata with a bytes[] param
/// // cast cd "fn(uint,bytes,uint256)" 0x1234 0x74657374206D657373616765 0x5678
/// use libseawater::eth_serde::*;
/// use stylus_sdk::alloy_primitives::{uint, address, bytes};
/// # let encoded = bytes!(
/// #    "d9828c45"
/// #    "0000000000000000000000000000000000000000000000000000000000001234"
/// #    "0000000000000000000000000000000000000000000000000000000000000080"
/// #    "0000000000000000000000000000000000000000000000000000000000005678"
/// #    "000000000000000000000000000000000000000000000000000000000000000c"
/// #    "74657374206d6573736167650000000000000000000000000000000000000000"
/// # )
/// # .0;
///
/// let data = &encoded;
/// let (sel, data) = parse_selector(data);
/// let (amount, data) = parse_u256(data);
/// let (_, data) = take_word(data); // byte offset
/// let (amount2, data) = parse_u256(data);
/// let (encoded_bytes, data) = parse_bytes(data); // actual data lives at the end
///
/// assert_eq!(
///     sel,
///     u32::from_be_bytes(selector(b"fn(uint256,bytes,uint256)"))
/// );
/// assert_eq!(amount, uint!(0x1234_U256));
/// assert_eq!(amount2, uint!(0x5678_U256));
/// assert_eq!(encoded_bytes, "test message".as_bytes());
/// assert_eq!(data.len(), 0);
/// ```
pub fn parse_bytes(data: &[u8]) -> (&[u8], &[u8]) {
    let (len, data) = parse_u256(data);
    #[allow(clippy::unwrap_used)]
    let len: usize = len.try_into().unwrap();
    // padded_len is the total length
    let padded_len = len.next_multiple_of(32);

    let (padded_bytes, data) = data.split_at(padded_len);
    let bytes = &padded_bytes[0..len];

    (bytes, data)
}

#[cfg(test)]
mod test {
    use ruint_macro::uint;
    use stylus_sdk::alloy_primitives::{address, bytes};

    use super::*;

    #[test]
    fn parse_calldata() {
        // generated with
        // `cast cd "transfer(address,uint256)" 0x737B7865f84bDc86B5c8ca718a5B7a6d905776F6 0x1234
        let encoded = bytes!(
            "a9059cbb"
            "000000000000000000000000737b7865f84bdc86b5c8ca718a5b7a6d905776f6"
            "0000000000000000000000000000000000000000000000000000000000001234"
        )
        .0;

        let data = &encoded;
        let (sel, data) = parse_selector(data);
        let (to, data) = parse_addr(data);
        let (amount, data) = parse_u256(data);

        assert_eq!(
            sel,
            u32::from_be_bytes(selector(b"transfer(address,uint256)"))
        );
        assert_eq!(to, address!("737B7865f84bDc86B5c8ca718a5B7a6d905776F6 "));
        assert_eq!(amount, uint!(0x1234_U256));
        assert_eq!(data.len(), 0);
    }

    #[test]
    fn parse_calldata_bytes() {
        // test parsing calldata with a bytes[] param
        // cast cd "fn(address,uint,bytes,uint256)" 0x737B7865f84bDc86B5c8ca718a5B7a6d905776F6 0x1234 0x74657374206D657373616765 0x5678
        let encoded = bytes!(
            "b107950b"
            "000000000000000000000000737b7865f84bdc86b5c8ca718a5b7a6d905776f6"
            "0000000000000000000000000000000000000000000000000000000000001234"
            "0000000000000000000000000000000000000000000000000000000000000080"
            "0000000000000000000000000000000000000000000000000000000000005678"
            "000000000000000000000000000000000000000000000000000000000000000c"
            "74657374206d6573736167650000000000000000000000000000000000000000"
        )
        .0;

        let data = &encoded;
        let (sel, data) = parse_selector(data);
        let (to, data) = parse_addr(data);
        let (amount, data) = parse_u256(data);
        let (_, data) = take_word(data); // placeholder
        let (amount2, data) = parse_u256(data);
        let (encoded_bytes, data) = parse_bytes(data);

        assert_eq!(
            sel,
            u32::from_be_bytes(selector(b"fn(address,uint256,bytes,uint256)"))
        );
        assert_eq!(to, address!("737B7865f84bDc86B5c8ca718a5B7a6d905776F6 "));
        assert_eq!(amount, uint!(0x1234_U256));
        assert_eq!(amount2, uint!(0x5678_U256));
        assert_eq!(encoded_bytes, "test message".as_bytes());
        assert_eq!(data.len(), 0);
    }

    #[test]
    fn decode_bytes_multiword() {
        // test parsing calldata with a bytes[] param that goes over multiple words
        // cast cd "fn(address,uint,bytes,uint256)" 0x737B7865f84bDc86B5c8ca718a5B7a6d905776F6 0x1234 0x74657374206D65737361676574657374206D65737361676574657374206D657373616765 0x5678
        let encoded = bytes!(
            "b107950b"
            "000000000000000000000000737b7865f84bdc86b5c8ca718a5b7a6d905776f6"
            "0000000000000000000000000000000000000000000000000000000000001234"
            "0000000000000000000000000000000000000000000000000000000000000080"
            "0000000000000000000000000000000000000000000000000000000000005678"
            "0000000000000000000000000000000000000000000000000000000000000024"
            "74657374206d65737361676574657374206d65737361676574657374206d6573"
            "7361676500000000000000000000000000000000000000000000000000000000"
        )
        .0;

        let data = &encoded;
        let (sel, data) = parse_selector(data);
        let (to, data) = parse_addr(data);
        let (amount, data) = parse_u256(data);
        let (_, data) = take_word(data); // placeholder
        let (amount2, data) = parse_u256(data);
        let (encoded_bytes, data) = parse_bytes(data);

        assert_eq!(
            sel,
            u32::from_be_bytes(selector(b"fn(address,uint256,bytes,uint256)"))
        );
        assert_eq!(to, address!("737B7865f84bDc86B5c8ca718a5B7a6d905776F6 "));
        assert_eq!(amount, uint!(0x1234_U256));
        assert_eq!(amount2, uint!(0x5678_U256));
        assert_eq!(encoded_bytes, "test message".as_bytes().repeat(3));
        assert_eq!(data.len(), 0);
    }

    #[test]
    fn decode_multi_bytes() {
        // decode a function with two bytes parameters
        // cast cd "fn(address,uint,bytes,bytes,uint256)" 0x737B7865f84bDc86B5c8ca718a5B7a6d905776F6 0x1234 0x74657374206D657373616765 0x74776F206F66207468656D  0x5678
        let encoded = bytes!(
            "e6a092e5"
            "000000000000000000000000737b7865f84bdc86b5c8ca718a5b7a6d905776f6"
            "0000000000000000000000000000000000000000000000000000000000001234"
            "00000000000000000000000000000000000000000000000000000000000000a0"
            "00000000000000000000000000000000000000000000000000000000000000e0"
            "0000000000000000000000000000000000000000000000000000000000005678"
            "000000000000000000000000000000000000000000000000000000000000000c"
            "74657374206d6573736167650000000000000000000000000000000000000000"
            "000000000000000000000000000000000000000000000000000000000000000b"
            "74776f206f66207468656d000000000000000000000000000000000000000000"
        )
        .0;

        let data = &encoded;
        let (sel, data) = parse_selector(data);
        let (to, data) = parse_addr(data);
        let (amount, data) = parse_u256(data);
        let (_, data) = take_word(data); // placeholder
        let (_, data) = take_word(data); // placeholder
        let (amount2, data) = parse_u256(data);
        let (encoded_bytes, data) = parse_bytes(data);
        let (encoded_bytes2, data) = parse_bytes(data);

        assert_eq!(
            sel,
            u32::from_be_bytes(selector(b"fn(address,uint256,bytes,bytes,uint256)"))
        );
        assert_eq!(to, address!("737B7865f84bDc86B5c8ca718a5B7a6d905776F6 "));
        assert_eq!(amount, uint!(0x1234_U256));
        assert_eq!(amount2, uint!(0x5678_U256));
        assert_eq!(encoded_bytes, "test message".as_bytes());
        assert_eq!(encoded_bytes2, "two of them".as_bytes());
        assert_eq!(data.len(), 0);
    }

    #[test]
    fn parse_other_types() {
        let encoded = bytes!(
            "97c3041e"
            "000000000000000000000000000000000000000000000000000000000000001e"
            "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc18"
            "0000000000000000000000000000000000000000000000000000000000000001"
            "0000000000000000000000000000000000000000000000000000000000000000"
            "0000000000000000000000000000000000000000000000000000000000001234"
        )
        .0;

        let data = &encoded;
        let (sel, data) = parse_selector(data);
        let (int_1, data) = parse_i32(data);
        let (int_2, data) = parse_i128(data);
        let (bool_1, data) = parse_bool(data);
        let (bool_2, data) = parse_bool(data);
        let (num, data) = parse_u256(data);

        assert_eq!(
            sel,
            u32::from_be_bytes(selector(b"fn(int32,int128,bool,bool,uint256)"))
        );
        assert_eq!(int_1, 30);
        assert_eq!(int_2, -1000);
        assert_eq!(bool_1, true);
        assert_eq!(bool_2, false);
        assert_eq!(num, uint!(0x1234_U256));
        assert_eq!(data.len(), 0);
    }
}
