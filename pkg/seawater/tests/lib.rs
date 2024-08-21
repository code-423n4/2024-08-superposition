use libseawater::{
    error::Error,
    eth_serde,
    maths::{full_math, sqrt_price_math, tick_math},
    test_utils,
    types::I256Extension,
    types::*,
    Pools,
};
use maplit::hashmap;
use ruint_macro::uint;
use stylus_sdk::{
    alloy_primitives::{address, bytes},
    msg,
};

#[test]
fn test_decode_swap() {
    // taken from an ethers generated blob
    let data = bytes!(
        "baef4bf9"
        "00000000000000000000000028f99e094fc846d4f5c8ad91e2ffd6ff92b0e7ca"
        "0000000000000000000000000000000000000000000000000000000000000001"
        "000000000000000000000000000000000000000000000000000000000000000a"
        "00000000000000000000000000000000000000057a2b748da963c00000000000"
        "0000000000000000000000000000000000000000000000000000000000000001"
        "00000000000000000000000000000000000000000000000000000000655d6b6d"
        "000000000000000000000000000000000000000000000000000000000000000a"
        "0000000000000000000000000000000000000000000000000000000000000100"
        "0000000000000000000000000000000000000000000000000000000000000041"
        "749af269b6860d64e97485e6be28448028f0e5e306b723fec3967bd489d667c8"
        "3c679180bc36f3d6ea751198b01e4b082e83ed853265a504d1f56f6712ee7380"
        "1b00000000000000000000000000000000000000000000000000000000000000"
    )
    .0;

    let data = &data;

    let (_, data) = eth_serde::parse_selector(data);
    let (pool, data) = eth_serde::parse_addr(data);
    let (zero_for_one, data) = eth_serde::parse_bool(data);
    let (amount, data) = eth_serde::parse_i256(data);
    let (_price_limit_x96, data) = eth_serde::parse_u256(data);
    let (nonce, data) = eth_serde::parse_u256(data);
    let (_deadline, data) = eth_serde::parse_u256(data);
    let (max_amount, data) = eth_serde::parse_u256(data);
    let (_, data) = eth_serde::take_word(data); // placeholder
    let (_sig, data) = eth_serde::parse_bytes(data);

    assert_eq!(pool, address!("28f99e094fc846d4f5c8ad91e2ffd6ff92b0e7ca"));
    assert_eq!(zero_for_one, true);
    assert_eq!(amount.abs_pos().unwrap(), uint!(10_U256));
    assert_eq!(nonce, uint!(1_U256));
    assert_eq!(max_amount, uint!(10_U256));
    assert_eq!(data.len(), 0);
}

#[test]
fn test_similar_to_ethers() -> Result<(), Vec<u8>> {
    test_utils::with_storage::<_, Pools, _>(
        Some(address!("feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5").into_array()),
        None, // slots map
        None, // caller erc20 balances
        None, // amm erc20 balances
        |contract| {
            // Create the storage
            contract.ctor(msg::sender(), Address::ZERO, Address::ZERO)?;
            let token_addr = address!("97392C28f02AF38ac2aC41AF61297FA2b269C3DE");

            // First, we set up the pool.
            contract.create_pool_D650_E2_D0(
                token_addr,
                test_utils::encode_sqrt_price(50, 1), // the price
                0,
                1,
                100000000000,
            )?;

            contract.enable_pool_579_D_A658(token_addr, true)?;

            let lower_tick = test_utils::encode_tick(50);
            let upper_tick = test_utils::encode_tick(150);
            let liquidity_delta = 20000;

            // Begin to create the position, following the same path as
            // in `createPosition` in ethers-tests/tests.ts
            contract.mint_position_B_C5_B086_D(token_addr, lower_tick, upper_tick)?;
            let position_id = contract
                .next_position_id
                .clone()
                .checked_sub(U256::one())
                .unwrap();

            contract.update_position_C_7_F_1_F_740(token_addr, position_id, liquidity_delta)?;

            Ok(())
        },
    )
}

#[test]
fn test_alex() -> Result<(), Vec<u8>> {
    test_utils::with_storage::<_, Pools, _>(
        Some(address!("feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5").into_array()),
        None, // slots map
        None, // caller erc20 balances
        None, // amm erc20 balances
        |contract| {
            // Create the storage
            contract.seawater_admin.set(msg::sender());
            let token_addr = address!("97392C28f02AF38ac2aC41AF61297FA2b269C3DE");

            // First, we set up the pool.
            contract.create_pool_D650_E2_D0(
                token_addr,
                test_utils::encode_sqrt_price(100, 1), // the price
                0,
                1,
                100000000000,
            )?;

            contract.enable_pool_579_D_A658(token_addr, true)?;

            let lower_tick = 39122;
            let upper_tick = 50108;
            let liquidity_delta = 20000;

            // Begin to create the position, following the same path as
            // in `createPosition` in ethers-tests/tests.ts
            contract.mint_position_B_C5_B086_D(token_addr, lower_tick, upper_tick)?;
            let position_id = contract
                .next_position_id
                .clone()
                .checked_sub(U256::one())
                .unwrap();

            contract.update_position_C_7_F_1_F_740(token_addr, position_id, liquidity_delta)?;

            Ok(())
        },
    )
}

#[test]
fn broken_alex_1() -> Result<(), Vec<u8>> {
    //curl -d '{"jsonrpc":"2.0","id":757,"method":"eth_call","params":[{"data":"0x41e3cc580000000000000000000000006437fdc89ced41941b97a9f1f8992d88718c81c5000000000000000000000000de104342b32bca03ec995f999181f7cf1ffc04d7000000000000000000000000000000000000000000000000000000002e56dc130000000000000000000000000000000000000000000000000000000000000000","from":"0xFEb6034FC7dF27dF18a3a6baD5Fb94C0D3dCb6d5","to":"0x839c5cf32d9Bc2CD46027691d2941410251ED557"},"0x10d889"]}' -H 'Content-Type: application/json' https://testnet-rpc.superposition.so
    test_utils::with_storage::<_, Pools, _>(
        Some(address!("feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5").into_array()),
        Some(hashmap! {
                    "0x0000000000000000000000000000000000000000000000000000000000000000" => "0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5",
                    "0x0000000000000000000000000000000000000000000000000000000000000001" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x111d0640f526af34ab2c2b0a7859bd6d5100bb79adfa42d06f0cf959c792e4bd" => "0x00000000000000000080000000000000001000010000001ffffffffffffffffd",
                    "0x127adb37788cce1252b022d229a4fd60399a3fa76e042c0dd89fa08d3d385ecf" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x3c79da47f96b0f39664f73c0a1f350580be90742947dddfa21ba64d578dfe600" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x3ee48c14b3579f9b80cbeda2dd14aff7d08bd3f20e4adb29e061f7e21c2b2390" => "0xffffffffffffffffffffffff8f7a9949000000000000000000000000708566b7",
                    "0x3ee48c14b3579f9b80cbeda2dd14aff7d08bd3f20e4adb29e061f7e21c2b2391" => "0x0000000000000000000000000000000003ef2486b343c64fd68682c6c9a39702",
                    "0x3ee48c14b3579f9b80cbeda2dd14aff7d08bd3f20e4adb29e061f7e21c2b2392" => "0x0000000000000000000000000000000004639bdb54f7a1de921aa7ac30d0eb37",
                    "0x4e593f089becaec71895b870bff209137b04c509f7c3d755280f95ef7fe0c266" => "0xffffffffffffffffffffffff140b15d7000000000000000000000000ebf4ea29",
                    "0x4e593f089becaec71895b870bff209137b04c509f7c3d755280f95ef7fe0c267" => "0x00000000000000000000000000000000058780d9fe6e0d1149ad0006e7982ddc",
                    "0x4e593f089becaec71895b870bff209137b04c509f7c3d755280f95ef7fe0c268" => "0x00000000000000000000000000000000067b9c47122bb9ed2d63aae72a998814",
                    "0x0531c08c13d7e1cc22a0194c3aa9402a78f465e53644da5608e58e4d6c2461bb" => "0x00000000000000000000ffffffffffffffffffffffffffffffff3c00000bb801",
                    "0x0531c08c13d7e1cc22a0194c3aa9402a78f465e53644da5608e58e4d6c2461bd" => "0x00000000000000000000000000000000000001de1a7b5d4bdf78aa7f8d27b430",
                    "0x0531c08c13d7e1cc22a0194c3aa9402a78f465e53644da5608e58e4d6c2461bf" => "0x000000000000000000000000fffcfafc00000000000000000023a204db6e3e43",
                    "0x0531c08c13d7e1cc22a0194c3aa9402a78f465e53644da5608e58e4d6c2461c0" => "0x000000000000000000000000000000000000000000034ece95de4a271d37d4bb",
                    "0x803a21268f706b17aba4df8977c8c2d84f261ad3c6b0157dbe2ce75b00255f1d" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x8fbdd8104933a0a177010a6634261ffafc4ccc198a7e6ad034d7dcf09d0f560d" => "0x00000000000000000000ffffffffffffffffffffffffffffffff3c00000bb801",
                    "0x8fbdd8104933a0a177010a6634261ffafc4ccc198a7e6ad034d7dcf09d0f560e" => "0x000000000000000000000000000000000695b3b05f82082039034776136488f9",
                    "0x8fbdd8104933a0a177010a6634261ffafc4ccc198a7e6ad034d7dcf09d0f560f" => "0x0000000000000000000000000000000007de13c37272a27e0aed554d426a9659",
                    "0x8fbdd8104933a0a177010a6634261ffafc4ccc198a7e6ad034d7dcf09d0f5611" => "0x00000000000000000000000000000a7500000000000000000000000a3df46e4f",
                    "0x8fbdd8104933a0a177010a6634261ffafc4ccc198a7e6ad034d7dcf09d0f5612" => "0x000000000000000000000000000000000000000124ad1007a9006875318589bb",
                    "0x91845b320c9a0f2447c33f2bd36de32c10319bb903ae7c0066b103d5a7693daf" => "0xffffffffffffffffffffffff55a4a029000000000000000000000000aa5b5fd7",
                    "0x91845b320c9a0f2447c33f2bd36de32c10319bb903ae7c0066b103d5a7693db0" => "0x0000000000000000000000000000000005ef12cf9a3c52405e671fbc7004d116",
                    "0x91845b320c9a0f2447c33f2bd36de32c10319bb903ae7c0066b103d5a7693db1" => "0x000000000000000000000000000000000702c066c65881164bf64bf87875e663",
                    "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0xabd3359f9239057b6bb692fc5d5f31334d460927d27c5bd0ba2f301926d78c01" => "0xfffffffffffffffffffffffe8892af80000000000000000000000001776d5080",
                    "0xabd3359f9239057b6bb692fc5d5f31334d460927d27c5bd0ba2f301926d78c02" => "0x00000000000000000000000000000000050e6ee1e84712c4b99bb7676a4e721a",
                    "0xabd3359f9239057b6bb692fc5d5f31334d460927d27c5bd0ba2f301926d78c03" => "0x0000000000000000000000000000000005deb0221d2632f8e79b6bcd3df4ddfa",
                    "0xb27456616f8c77c635d3551b8179f6887795e920c5c4421a6fa3c3c76fc90fa8" => "0x0000000000000000000000003645836695dfac66314dfca62184b0353e43c258",
                    "0xdc03f6203d56cf5fe49270519e5a797eebcd9be54de9070150d36d99795813bf" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0xe4b52e62780a151c755afd3ef54b84744b416592e47feb63654e3a8e0bb7d84d" => "0xffffffffffffffffffffffff64defe450000000000000000000000009b2101bb",
                    "0xe4b52e62780a151c755afd3ef54b84744b416592e47feb63654e3a8e0bb7d84e" => "0x000000000000000000000000000000000483f3e53b5ea3677da74656b7015fed",
                    "0xe4b52e62780a151c755afd3ef54b84744b416592e47feb63654e3a8e0bb7d84f" => "0x00000000000000000000000000000000052c6140b702b3c43d7128f67a9cb7d3",
                    "0xf55f69dbbfd00ec29a323ea4eb1513f3e0d1d702d854f8ec7456a6954b2a9cf9" => "0x0000000000000000000000000000000000000000000000000000000000000001",
        }),
        None, // caller balances
        None, // amm balances
        |contract| {
            use core::str::FromStr;

            let from = address!("6437fdc89cED41941b97A9f1f8992D88718C81c5");
            let to = address!("de104342B32BCa03ec995f999181f7Cf1fFc04d7");
            let amount = U256::from_str("10000000000").unwrap();
            let min_out = U256::from(0);
            let (_amount_in, _amount_out) = contract
                .swap_2_exact_in_41203_F1_D(from, to, amount, min_out)
                .unwrap();
            Ok(())
        },
    )
}

#[test]
fn broken_alex_2() -> Result<(), Vec<u8>> {
    test_utils::with_storage::<_, Pools, _>(
        Some(address!("feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5").into_array()),
        None,
        None,
        None,
        |_contract| Ok(()),
    )
}

#[test]
fn alex_0f08c379a() -> Result<(), Vec<u8>> {
    //curl -d '{"jsonrpc":"2.0","id":6646,"method":"eth_call","params":[{"data":"0xe83c30490000000000000000000000006437fdc89ced41941b97a9f1f8992d88718c81c500000000000000000000000000000000000000000000000000000000000081e40000000000000000000000000000000000000000000000000000000437ea0584","from":"0xFEb6034FC7dF27dF18a3a6baD5Fb94C0D3dCb6d5","to":"0x839c5cf32d9Bc2CD46027691d2941410251ED557"},"0x110bb6"]}' -H 'Content-Type: application/json' https://testnet-rpc.superposition.so
    test_utils::with_storage::<_, Pools, _>(
        Some(address!("feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5").into_array()),
        Some(hashmap! {
        "0x0000000000000000000000000000000000000000000000000000000000000000" => "0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5",
        "0x0000000000000000000000000000000000000000000000000000000000000001" => "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x127adb37788cce1252b022d229a4fd60399a3fa76e042c0dd89fa08d3d385ecf" => "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x3295b70d48c9d979f3e811eefc4335589c7c687db9128693f015bb35ed65873c" => "0x00000000000000000000000000000000000000000000000000000ff000000834",
        "0x3295b70d48c9d979f3e811eefc4335589c7c687db9128693f015bb35ed65873d" => "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x3295b70d48c9d979f3e811eefc4335589c7c687db9128693f015bb35ed65873e" => "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x3c79da47f96b0f39664f73c0a1f350580be90742947dddfa21ba64d578dfe600" => "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x60d1f3048e5b913a0cd1df4b045ae0ecf5e3ba8adbaf407638e7e15e3e75b5f1" => "0xfffffffffffffffffffffffe923fe5c20000000000000000000000016dc01a3e",
        "0x60d1f3048e5b913a0cd1df4b045ae0ecf5e3ba8adbaf407638e7e15e3e75b5f2" => "0x0000000000000000000000000000000002dcf66e6d0f31c3e94d01714646e21b",
        "0x60d1f3048e5b913a0cd1df4b045ae0ecf5e3ba8adbaf407638e7e15e3e75b5f3" => "0x000000000000000000000000000000000309be0285b029b1da390863e158aab4",
        "0x81e9c7c70971b5eb969cec21a82e6deed42e7c6736e0e83ced66d72297d9f1d7" => "0x000000000000000000000000ac31d6621f088fd08df6c546e9bf64d98f76a11a",
        "0x8ea865850c62a560a0f06c451f935cda83db645b8433d53ee25660e379ed9a05" => "0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5",
        "0x8fbdd8104933a0a177010a6634261ffafc4ccc198a7e6ad034d7dcf09d0f560d" => "0x00000000000000000000ffffffffffffffffffffffffffffffff3c00000bb801",
        "0x8fbdd8104933a0a177010a6634261ffafc4ccc198a7e6ad034d7dcf09d0f560e" => "0x0000000000000000000000000000000006c582de91f687cbc1bbd2d7ede29f6d",
        "0x8fbdd8104933a0a177010a6634261ffafc4ccc198a7e6ad034d7dcf09d0f560f" => "0x0000000000000000000000000000000008211b700f0b08eb8ff117cc5be381a0",
        "0x8fbdd8104933a0a177010a6634261ffafc4ccc198a7e6ad034d7dcf09d0f5611" => "0x00000000000000000000000000000b9a0000000000000000000000055f1a022e",
        "0x8fbdd8104933a0a177010a6634261ffafc4ccc198a7e6ad034d7dcf09d0f5612" => "0x000000000000000000000000000000000000000128fc70094157b85d8b948471",
        "0x0951df22610b1d641fffea402634ee523fece890ea56ecb57d4eb766ca391d50" => "0xffffffffffffffffffffffffd3d2cc010000000000000000000000002c2d33ff",
        "0x0951df22610b1d641fffea402634ee523fece890ea56ecb57d4eb766ca391d51" => "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0951df22610b1d641fffea402634ee523fece890ea56ecb57d4eb766ca391d52" => "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50" => "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0xdc03f6203d56cf5fe49270519e5a797eebcd9be54de9070150d36d99795813bf" => "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x3b77a15f47a3e0631c64845cd046efa6f46e623465f5ed88d8f1673aa9e1a541" => "0x00000000000000000000000000000000000000097d9e34b457d2ebda0c06c859",
         }),
        Some(hashmap! {
            address!("6437fdc89ced41941b97a9f1f8992d88718c81c5") => U256::from(777444371)
        }), // caller balances
        None, // amm balances
        |contract| {
            use core::str::FromStr;

            let pool_addr = address!("6437fdc89cED41941b97A9f1f8992D88718C81c5");
            let id = U256::from(33252);
            let _delta = i128::from_str("18117952900").unwrap();

            let pool = contract.pools.get(pool_addr);

            let _liq = pool.get_position_liquidity(id);
            let _sqrt_price = pool.get_sqrt_price();
            let tick_current = pool.get_cur_tick().as_i32();

            let position = pool.get_position(id);
            let tick_lower = position.lower.get().as_i32();
            let tick_upper = position.upper.get().as_i32();

            let _sqrt_current = tick_math::get_sqrt_ratio_at_tick(tick_current)?;
            let _sqrt_lower = tick_math::get_sqrt_ratio_at_tick(tick_lower)?;
            let _sqrt_upper = tick_math::get_sqrt_ratio_at_tick(tick_upper)?;

            #[cfg(feature = "testing-dbg")]
            dbg!((
                "update_position",
                _liq,
                _sqrt_price,
                tick_current,
                id,
                _delta,
                tick_lower,
                tick_upper,
                _sqrt_lower,
                _sqrt_upper,
                _sqrt_current
            ));

            // liquidity		0
            // sqrt price	91912741289436239605563425905
            // current tick	2970
            // id			33252
            // delta		18117952900
            // tick lower	2100
            // tick upper	4080
            // sqrt current	91911338314972375132734921679
            // sqrt lower	87999098777895760865233273050
            // sqrt upper	97156358459122590463153608088

            //let (_amount_0, _amount_1) = contract.update_position__d58ed3(pool_addr, id, delta).unwrap();

            Ok(())
        },
    )
}

#[test]
fn decr_nonexisting_position() {
    use core::str::FromStr;

    let token = Address::with_last_byte(1);

    test_utils::with_storage::<_, Pools, _>(
        Some(address!("feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5").into_array()),
        None,
        None,
        None,
        |contract| -> Result<(), Vec<u8>> {
            contract.ctor(msg::sender(), msg::sender(), msg::sender())?;

            contract.create_pool_D650_E2_D0(
                token,
                U256::from_str("792281625142643375935439503360").unwrap(), // encodeSqrtPrice(100)
                3000,
                1,
                u128::MAX,
            )?;

            contract.enable_pool_579_D_A658(token, true)?;

            let id = U256::from(0);

            contract.mint_position_B_C5_B086_D(token, -887272, 887272)?;

            assert_eq!(
                contract
                    .decr_position_09293696(
                        token,
                        id,
                        U256::zero(),
                        U256::zero(),
                        U256::from(10000),
                        U256::from(10000),
                    )
                    .unwrap_err(),
                Vec::<u8>::from(Error::LiquiditySub)
            );

            Ok(())
        },
    )
    .unwrap();
}

#[test]
fn decr_existing_position_some() {
    use core::str::FromStr;

    let token = Address::with_last_byte(1);

    test_utils::with_storage::<_, Pools, _>(
        Some(address!("feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5").into_array()),
        None,
        None,
        None,
        |contract| -> Result<(), Vec<u8>> {
            contract.ctor(msg::sender(), msg::sender(), msg::sender())?;

            contract.create_pool_D650_E2_D0(
                token,
                U256::from_str("792281625142643375935439503360").unwrap(), // encodeSqrtPrice(100)
                3000,
                1,
                u128::MAX,
            )?;

            contract.enable_pool_579_D_A658(token, true)?;

            let id = U256::from(0);

            contract.mint_position_B_C5_B086_D(token, -887272, 887272)?;

            let (amount_0_taken, amount_1_taken) = contract.incr_position_C_3_A_C_7_C_A_A(
                token,
                id,
                U256::zero(),
                U256::zero(),
                U256::from(100_000),
                U256::from(100_000),
            )?;

            // Took some amount off the amount to take, since the taking rounds
            // up, and the removal rounds down.

            contract.decr_position_09293696(
                token,
                id,
                U256::from(998),
                U256::from(99_000),
                amount_0_taken,
                amount_1_taken,
            )?;

            Ok(())
        },
    )
    .unwrap();
}

#[test]
fn eli_incr_position() {
    // This test was written after a real life error came up. We believe the
    // source of this stems from a misconfiguration in the original swap code
    // where delta could be 0, but we haven't conclusively found the reason
    // why.

    //curl -d '{"jsonrpc":"2.0","method":"eth_call","id":123,"params":[{"from": "0xfeb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5", "to": "0xE13Fec14aBFbAa5b185cFb46670A56BF072E13b1", "data": "0x000001ea00000000000000000000000022b9fa698b68bba071b513959794e9a47d19214c000000000000000000000000000000000000000000000000000000000000064d0000000000000000000000000000000000000000000000006f05b59d3b20000000000000000000000000000000000000000000000000000000000001c08c19960000000000000000000000000000000000000000000000007ce66c50e284000000000000000000000000000000000000000000000000000000000001f89d9cc9"}, "0x64160b"]}' https://testnet-rpc.superposition.so
    //cast call -r https://testnet-rpc.superposition.so --block 6559243 0xA8EA92c819463EFbEdDFB670FEfC881A480f0115 'balanceOf(address)(uint256)' 0xfeb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5
    //cast call -r https://testnet-rpc.superposition.so --block 6559243 0x22b9fa698b68bBA071B513959794E9a47d19214c 'balanceOf(address)(uint256)' 0xfeb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5

    test_utils::with_storage::<_, Pools, _>(
            Some(address!("feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5").into_array()), // sender
            Some(hashmap! {
                "0x0000000000000000000000000000000000000000000000000000000000000000" => "0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5",
                "0x2094fc11ba78df2b7ed9c7631680af7cf7bd4803bac5c7331fb2686e5c11e38e" => "0x00000000000000000000000000000000d3c21bcecceda10000003c00000bb801",
                "0x2094fc11ba78df2b7ed9c7631680af7cf7bd4803bac5c7331fb2686e5c11e38f" => "0x000000000000000000000000000000cb0390d6100490f63f7f7eea00c57729f9",
                "0x2094fc11ba78df2b7ed9c7631680af7cf7bd4803bac5c7331fb2686e5c11e390" => "0x0000000000000000000000000000000000000346dd57f57ca689b26e8097f476",
                "0x2094fc11ba78df2b7ed9c7631680af7cf7bd4803bac5c7331fb2686e5c11e392" => "0x000000000000000000000000fffcd03b00000000000000000021f18cc0777544",
                "0x2094fc11ba78df2b7ed9c7631680af7cf7bd4803bac5c7331fb2686e5c11e393" => "0x00000000000000000000000000000000000000000001e9e96d7a34fd85eae8d9",
                "0x3c79da47f96b0f39664f73c0a1f350580be90742947dddfa21ba64d578dfe600" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x81e9c7c70971b5eb969cec21a82e6deed42e7c6736e0e83ced66d72297d9f1d7" => "0x0000000000000000000000002b4158d5fa1c37a35aedc38c5018778582f96518",
                "0x82caad41943cad78d11370ed20b2b5987170ccd3281840e2d8b33cec638c739c" => "0x000000000000000000001f23059fc0ce000000000000000000001f23059fc0ce",
                "0x82caad41943cad78d11370ed20b2b5987170ccd3281840e2d8b33cec638c739d" => "0x000000000000000000000000000000c8bf088f0c4f2795f8c7115662b99fa813",
                "0x82caad41943cad78d11370ed20b2b5987170ccd3281840e2d8b33cec638c739e" => "0x000000000000000000000000000000000000033eb616ef0d7044988577cf002d",
                "0x82caad41943cad78d11370ed20b2b5987170ccd3281840e2d8b33cec638c73a0" => "0x0000000000000000000000000000000000000000000000000000000000000001",
                "0x830d8ac5b57f386d159b0fe8f38030b1491866ba79d0ef9d011fbf2934391286" => "0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5",
                "0x9777d3d8106751edcbd161850d58ac0568e8ccdaa496416b38ce8766d0f43dc7" => "0x000000000000000000000000000000000000000000000000fffcd3e4fffccc28",
                "0x9777d3d8106751edcbd161850d58ac0568e8ccdaa496416b38ce8766d0f43dc8" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x9777d3d8106751edcbd161850d58ac0568e8ccdaa496416b38ce8766d0f43dc9" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0xbbac0133cfaf5a642a8b781b0299f03f9768f30560c8792fef327372895fb118" => "0xffffffffffffffffffffda2df47c2b2b0000000000000000000025d20b83d4d5",
                "0xbbac0133cfaf5a642a8b781b0299f03f9768f30560c8792fef327372895fb119" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0xbbac0133cfaf5a642a8b781b0299f03f9768f30560c8792fef327372895fb11a" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0xbbac0133cfaf5a642a8b781b0299f03f9768f30560c8792fef327372895fb11c" => "0x0000000000000000000000000000000000000000000000000000000000000001",
}),
            Some(hashmap! {
            	address!("A8EA92c819463EFbEdDFB670FEfC881A480f0115") => U256::from_limbs([10000000000000000000, 5, 0, 0]),
            	address!("22b9fa698b68bBA071B513959794E9a47d19214c") => U256::from_limbs([9000000000, 1842, 0, 0])
            }),
            None,
            |contract| -> Result<(), Vec<u8>> {
                // Start by estimating what the token suggestion should be

                // lower tick -209880
                // upper tick -207900

                //2195943438955908078141207
                let price_lower = U256::from_limbs([6130933375634669335, 119042, 0, 0]);

                //2424455146405991693936024
                let price_upper = U256::from_limbs([18019542419034596760, 131429, 0, 0]);

                let token = address!("22b9fa698b68bBA071B513959794E9a47d19214c");

                let id = U256::from(1613);

                let token_0_bal = full_math::mul_div(
                    U256::from_limbs([10000000000000000000, 0, 0, 0]),
                    U256::from(80),
                    U256::from(10),
                )?;

                let token_1_bal = full_math::mul_div(
                    U256::from_limbs([9000000000, 0, 0, 0]),
                    U256::from(80),
                    U256::from(10),
                )?;

                let price_cur = contract.sqrt_price_x967_B8_F5_F_C5(token)?;

                let liq = sqrt_price_math::get_liquidity_for_amounts(
                    price_cur,
                    price_lower,
                    price_upper,
                    token_0_bal,
                    token_1_bal
                )?.try_into().unwrap();

                // price cur: 2313543190168391606003929, price lower: 2195943438955908078141207, price upper: 2424455146405991693936024, liq: 48507140892841379
                // token0 desired: 75992697509586515214, token1 desired: 72000000000, token0 min: 721930626341071894533, token1 min: 684000000000

                let (token_0_desired, token_1_desired) = sqrt_price_math::get_amounts_for_delta(
                    price_cur,
                    price_lower,
                    price_upper,
                    liq
                )?;

                let token_0_desired =token_0_desired.try_into().unwrap();
                let token_1_desired =token_1_desired.try_into().unwrap();

                let token_0_min = full_math::mul_div(
                    token_0_desired,
                    U256::from(95),
                    U256::from(100),
                )?;

                let token_1_min = full_math::mul_div(
                    token_1_desired,
                    U256::from(95),
                    U256::from(100),
                )?;

                eprintln!("token0 desired: {}, token1 desired: {}, token0 min: {}, token1 min: {}", token_0_desired, token_1_desired, token_0_min, token_1_min);

                contract.incr_position_C_3_A_C_7_C_A_A(token, id, token_0_min, token_1_min, token_0_desired, token_1_desired)?;

                 Ok(())
            },
        ).unwrap();
}

#[test]
fn test_0f08c379a_alex_2() {
    // This test should revert since we don't have balance to handle what it's asking - correct behaviour.

    //curl -d '{"jsonrpc":"2.0","id":238,"method":"eth_call","params":[{"data":"0x00000000000000000000000000000000de104342b32bca03ec995f999181f7cf1ffc04d70000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e800ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff","from":"0xFEb6034FC7dF27dF18a3a6baD5Fb94C0D3dCb6d5","to":"0xE13Fec14aBFbAa5b185cFb46670A56BF072E13b1"},"0x6b3ea8"]}' https://testnet-rpc.superposition.so
    //cast call -r https://testnet-rpc.superposition.so --block 7028392 0xA8EA92c819463EFbEdDFB670FEfC881A480f0115 'balanceOf(address)(uint256)' 0xE13Fec14aBFbAa5b185cFb46670A56BF072E13b1
    //cast call -r https://testnet-rpc.superposition.so --block 7028392 0xde104342B32BCa03ec995f999181f7Cf1fFc04d7 'balanceOf(address)(uint256)' 0xE13Fec14aBFbAa5b185cFb46670A56BF072E13b1
    //cast call -r https://testnet-rpc.superposition.so --block 7028392 0xE13Fec14aBFbAa5b185cFb46670A56BF072E13b1 'quote72E2ADE7(address,bool,int256,uint256)' 0xde104342b32bca03ec995f999181f7cf1ffc04d7 false 100000000000 115792089237316195423570985008687907853269984665640564039457584007913129639935

    test_utils::with_storage::<_, Pools, _>(
            Some(address!("feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5").into_array()), // sender
            Some(hashmap! {
                "0x0000000000000000000000000000000000000000000000000000000000000000" => "0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5",
                "0x0000000000000000000000000000000000000000000000000000000000000001" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x3c79da47f96b0f39664f73c0a1f350580be90742947dddfa21ba64d578dfe600" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x531c08c13d7e1cc22a0194c3aa9402a78f465e53644da5608e58e4d6c2461bb0" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x531c08c13d7e1cc22a0194c3aa9402a78f465e53644da5608e58e4d6c2461bd0" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x531c08c13d7e1cc22a0194c3aa9402a78f465e53644da5608e58e4d6c2461bf0" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x531c08c13d7e1cc22a0194c3aa9402a78f465e53644da5608e58e4d6c2461c00" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x53722e8c7bba9e236c6560d04a835813c2f6bbfc11f186e4083355f565c5a527" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x5518e47b0116f99961e81eefcdac5dd3b67ddc2590365597738152ee88460290" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x6eb0351d65561d858b3b4ed3be4a248319172f3048f5c0878165443a558b31e3" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x7ab5dbebd512ecc4ef5dacaee1d6a02bc7c2ef5811973a23d525e9f0c65cd56a" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x913214d283b41207efc2a68c825e97520e67736352f5a6043a92e38877fbbd95" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x990b23368a7d7e546cc6392f4b5c6a5b998d63ba4fbd63b154ff4f2f903a9cd4" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0xa0d6eb0a3b8e8951adb6af4198c5cb4f43f92daf07eaefe4caaded6470e05d46" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0xb27456616f8c77c635d3551b8179f6887795e920c5c4421a6fa3c3c76fc90fa8" => "0x0000000000000000000000002dd66fec942cdbf2673d47083eccf5fe45230ff9",
                "0xf55f69dbbfd00ec29a323ea4eb1513f3e0d1d702d854f8ec7456a6954b2a9cf9" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x0531c08c13d7e1cc22a0194c3aa9402a78f465e53644da5608e58e4d6c2461bb" => "0x00000000000000000000000000000000d3c21bcecceda10000003c00000bb801",
                "0x1b3a8bd1daefb7ea05f1c8d9ce78c349b128450be6d62ad3c14e2e5fb8b4933c" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x0531c08c13d7e1cc22a0194c3aa9402a78f465e53644da5608e58e4d6c2461bf" => "0x000000000000000000000000fffd2c09000000000000000000076518630c29c8",
                "0xf55f69dbbfd00ec29a323ea4eb1513f3e0d1d702d854f8ec7456a6954b2a9cf9" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x0531c08c13d7e1cc22a0194c3aa9402a78f465e53644da5608e58e4d6c2461bd" => "0x00000000000000000000000000000000000b3f2fa99c2da9ad7a3f65c9e79ccf",
                "0x0531c08c13d7e1cc22a0194c3aa9402a78f465e53644da5608e58e4d6c2461c0" => "0x0000000000000000000000000000000000000000000632719ccbf4e4387b6b44",
            }),
            None,
            Some(hashmap! {
                address!("A8EA92c819463EFbEdDFB670FEfC881A480f0115") => U256::from_limbs([877426729983, 0, 0, 0]),
                address!("de104342B32BCa03ec995f999181f7Cf1fFc04d7") => U256::from_limbs([82780218574, 0, 0, 0])
            }),
            |contract| -> Result<(), Vec<u8>> {
                 let token = address!("de104342b32bca03ec995f999181f7cf1ffc04d7");
                 let amount_in_ui = I256::from_limbs([100000000000, 0, 0, 0]);
                 //let amount_quoted = contract.quote_72_E2_A_D_E7(token, false, amount_in_ui, U256::MAX);
                 //eprintln!("amount quoted: ${:?}", amount_quoted);
                 let price_before = contract.sqrt_price_x967_B8_F5_F_C5(token)?;
                 let (amount_0_delta, amount_1_out) = contract.swap_904369_B_E(token, false, amount_in_ui, U256::MAX)?;
                 //the frontend quoted that for the amount given, 1.061269 weth should be returned
                 let price_after = contract.sqrt_price_x967_B8_F5_F_C5(token)?;
                 eprintln!("amount 0 delta: {}, amount 1 out: {}, price_before: {}, price_after: {}", amount_0_delta, amount_1_out, price_before, price_after);
                 Ok(())
            },
        ).unwrap_err();
}

#[test]
fn incr_position_fee_growth_tick() {
    //curl -d '{"jsonrpc":"2.0","method":"eth_call","id":123,"params":[{"from": "0xfeb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5", "to": "0xE13Fec14aBFbAa5b185cFb46670A56BF072E13b1", "data": "0x0000010200000000000000000000000022b9fa698b68bba071b513959794e9a47d19214c000000000000000000000000000000000000000000000000000000000000e8530000000000000000000000000000000000000000000000000b1a2bc2ec500000000000000000000000000000000000000000000000000000000000000414a37c0000000000000000000000000000000000000000000000000c7d713b49da000000000000000000000000000000000000000000000000000000000000049737eb"}, "0x7001e5"]}' https://testnet-rpc.superposition.so

    test_utils::with_storage::<_, Pools, _>(
            Some(address!("feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5").into_array()), // sender
            Some(hashmap! {
                    "0x0000000000000000000000000000000000000000000000000000000000000000" => "0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5",
                    "0x2094fc11ba78df2b7ed9c7631680af7cf7bd4803bac5c7331fb2686e5c11e38e" => "0x00000000000000000000000000000000d3c21bcecceda10000003c00000bb801",
                    "0x2094fc11ba78df2b7ed9c7631680af7cf7bd4803bac5c7331fb2686e5c11e38f" => "0x000000000000000000000000000002946e618fc1c100eb2ece23c766dc7fe332",
                    "0x2094fc11ba78df2b7ed9c7631680af7cf7bd4803bac5c7331fb2686e5c11e390" => "0x00000000000000000000000000000000000003e430416229f385847e3438b6a0",
                    "0x2094fc11ba78df2b7ed9c7631680af7cf7bd4803bac5c7331fb2686e5c11e392" => "0x000000000000000000000000fffc729800000000000000000e000843c6b7e857",
                    "0x3c79da47f96b0f39664f73c0a1f350580be90742947dddfa21ba64d578dfe600" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x441db1f4a15f63dd7988db6d518ae69b05a4bd5f528ae8589d82253ea85c9bcb" => "0x000000000000000000000000000000000000000000000000fffc7660fffc6e68",
                    "0x606b7cbac0ee9fcaadc6dc1a873e9053536063080567030e6f1bbeeecc7c5b99" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x606b7cbac0ee9fcaadc6dc1a873e9053536063080567030e6f1bbeeecc7c5b9d" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x81e9c7c70971b5eb969cec21a82e6deed42e7c6736e0e83ced66d72297d9f1d7" => "0x000000000000000000000000eb365e1d8113e2dc89eaffeb0eb8655de541e068",
                    "0x9082b893d81e13a22d3a20bb475d762420aa82b1b423048886c8649938325d80" => "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0xc26292c271d836cef11934ee150114f8ac724da089d6e3a3a515a1943495adf9" => "0x0000000000000000000258aa211fc79e0000000000000000000258aa211fc79e",
                    "0xc26292c271d836cef11934ee150114f8ac724da089d6e3a3a515a1943495adfa" => "0x000000000000000000000000000002340f77a54003eed89b1a97894b15c82a7c",
                    "0xc26292c271d836cef11934ee150114f8ac724da089d6e3a3a515a1943495adfb" => "0x00000000000000000000000000000000000003ccff159d3a26244013f0917ad0",
                    "0x09082b893d81e13a22d3a20bb475d762420aa82b1b423048886c8649938325d8" => "0x000000000000000000000000feb6034fc7df27df18a3a6bad5fb94c0d3dcb6d5",
            }),
            None,
            None,
            |contract| -> Result<(), Vec<u8>> {
                let token = address!("22b9fa698b68bba071b513959794e9a47d19214c");
                let fee_global_0 = contract.fee_growth_global_0_38_B5665_B(token)?;
                let fee_global_1 = contract.fee_growth_global_1_A_33_A_5_A_1_B(token)?;
                let starting_fee = contract.fee_B_B_3_C_F_608(token)?;
                eprintln!("starting fee: {}, token: {}, fee global 0: {}, fee global 1: {}", starting_fee, token, fee_global_0, fee_global_1);
                contract.incr_position_C_3_A_C_7_C_A_A(
                    token,
                    U256::from(59475),
                    U256::from_limbs([762939453125, 0, 0, 0]),
                    U256::from_limbs([68461436, 0, 0, 0]),
                    U256::from_limbs([13732910156250, 0, 0, 0]),
                    U256::from_limbs([77019115, 0, 0, 0]),
                ).map(|_| ())
            },
        ).unwrap();
}

#[test]
fn ethers_suite_orchestrated_uniswap_single() {
    test_utils::with_storage::<_, Pools, _>(
        Some(address!("3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E").into_array()), // sender
        None,
        None,
        None,
        |contract| -> Result<(), Vec<u8>> {
            let token0 = address!("9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
            contract.ctor(msg::sender(), Address::ZERO, Address::ZERO)?;
            contract.create_pool_D650_E2_D0(
                token0,
                U256::from_limbs([0, 42949672960, 0, 0]), //792281625142643375935439503360
                500,                                      // fee
                10,                                       // tick spacing
                u128::MAX,
            )?;
            contract.enable_pool_579_D_A658(token0, true)?;
            contract.mint_position_B_C5_B086_D(token0, 39120, 50100)?;
            let id = U256::ZERO;
            contract
                .update_position_C_7_F_1_F_740(token0, id, 20000)
                .map(|_| ())?;
            let (amount_out_0, amount_out_1) = contract.swap_904369_B_E(
                token0,
                true,
                I256::try_from(1000_i32).unwrap(),
                U256::MAX,
            )?;
            assert_eq!(amount_out_0, I256::try_from(833).unwrap());
            assert_eq!(amount_out_1, I256::try_from(-58592).unwrap());
            Ok(())
        },
    )
    .unwrap()
}

#[test]
fn ethers_suite_orchestrated_uniswap_single_version_2() {
    test_utils::with_storage::<_, Pools, _>(
        Some(address!("3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E").into_array()), // sender
        None,
        None,
        None,
        |contract| -> Result<(), Vec<u8>> {
            let token0 = address!("9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
            contract.ctor(msg::sender(), Address::ZERO, Address::ZERO)?;
            contract.create_pool_D650_E2_D0(
                token0,
                U256::from_limbs([0, 42949672960, 0, 0]), //792281625142643375935439503360
                500,                                      // fee
                10,                                       // tick spacing
                u128::MAX,
            )?;
            contract.enable_pool_579_D_A658(token0, true)?;
            contract.mint_position_B_C5_B086_D(token0, 39120, 50100)?;
            let id = U256::ZERO;
            contract
                .update_position_C_7_F_1_F_740(token0, id, 20000)
                .map(|_| ())?;
            let (amount_out_0, amount_out_1) = contract.swap_904369_B_E(
                token0,
                false,
                I256::try_from(9_i32).unwrap(),
                U256::from_limbs([6743328256752651558, 17280870778742802505, 4294805859, 0])
                    - U256::one(), //146144670348521010328727305220398882237872397034 - 1
            )?;
            eprintln!("amount out 0: {amount_out_0}, amount out 1: {amount_out_1}");
            assert_eq!(amount_out_0, I256::ZERO);
            assert_eq!(amount_out_1, I256::try_from(9).unwrap());
            Ok(())
        },
    )
    .unwrap()
}

#[test]
fn ethers_suite_orchestrated_uniswap_two() {
    // Why does this break?

    test_utils::with_storage::<_, Pools, _>(
        Some(address!("3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E").into_array()), // sender
        None,
        None,
        None,
        |contract| {
            let token0 = address!("9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
            let token1 = address!("9fE46736679d2D9a65F0992F2272dE9f3c7fa6e1");
            contract
                .ctor(msg::sender(), Address::ZERO, Address::ZERO)
                .unwrap();
            contract
                .create_pool_D650_E2_D0(
                    token0,
                    U256::from_limbs([0, 42949672960, 0, 0]), //792281625142643375935439503360
                    500,                                      // fee
                    10,                                       // tick spacing
                    u128::MAX,
                )
                .unwrap();
            contract
                .create_pool_D650_E2_D0(
                    token1,
                    U256::from_limbs([0, 42949672960, 0, 0]), //792281625142643375935439503360
                    500,                                      // fee
                    10,                                       // tick spacing
                    u128::MAX,
                )
                .unwrap();
            contract.enable_pool_579_D_A658(token0, true).unwrap();
            contract.enable_pool_579_D_A658(token1, true).unwrap();
            contract
                .mint_position_B_C5_B086_D(token0, 39120, 50100)
                .unwrap();
            contract
                .mint_position_B_C5_B086_D(token1, 39120, 50100)
                .unwrap();
            let id = U256::ZERO;
            contract
                .update_position_C_7_F_1_F_740(token0, id, 20000)
                .unwrap();
            contract
                .update_position_C_7_F_1_F_740(token1, U256::one(), 20000)
                .unwrap();
            let (amount_out_0, amount_out_1) = contract
                .swap_2_exact_in_41203_F1_D(token0, token1, U256::from(1000), U256::from(10))
                .unwrap();
            eprintln!("final amount out 0: {amount_out_0}, amount out 1: {amount_out_1}");
        },
    );
}

#[test]
fn ethers_suite_swapping_with_permit2_blobs_no_permit2() {
    test_utils::with_storage::<_, Pools, _>(
        Some(address!("3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E").into_array()), // sender
        None,
        None,
        None,
        |contract| {
            let token0 = address!("9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
            contract
                .ctor(msg::sender(), Address::ZERO, Address::ZERO)
                .unwrap();
            contract
                .create_pool_D650_E2_D0(
                    token0,
                    U256::from_limbs([0, 42949672960, 0, 0]), //792281625142643375935439503360
                    500,                                      // fee
                    10,                                       // tick spacing
                    u128::MAX,
                )
                .unwrap();
            contract.enable_pool_579_D_A658(token0, true).unwrap();
            contract
                .mint_position_B_C5_B086_D(token0, 39120, 50100)
                .unwrap();
            let id = U256::ZERO;
            contract
                .update_position_C_7_F_1_F_740(token0, id, 20000)
                .unwrap();
            let (amount_out_0, amount_out_1) = contract
                .swap_904369_B_E(
                    token0,
                    true,
                    I256::try_from(10).unwrap(),
                    U256::from_limbs([12205810521336709120, 23524504717, 0, 0]), //433950517987477953199883681792
                )
                .unwrap();
            assert_eq!(amount_out_0, I256::try_from(10).unwrap());
            assert_eq!(amount_out_1, I256::try_from(-895).unwrap());
        },
    );
}
