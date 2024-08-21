export const output = {
  abi: [
    {
      type: "function",
      name: "authoriseEnabler5B17C274",
      inputs: [
        {
          name: "enabler",
          type: "address",
          internalType: "address",
        },
        {
          name: "enabled",
          type: "bool",
          internalType: "bool",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "burnPositionAE401070",
      inputs: [
        {
          name: "id",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "collect7F21947C",
      inputs: [
        {
          name: "pools",
          type: "address[]",
          internalType: "address[]",
        },
        {
          name: "ids",
          type: "uint256[]",
          internalType: "uint256[]",
        },
      ],
      outputs: [
        {
          name: "",
          type: "tuple[]",
          internalType: "struct ISeawaterExecutorPosition.CollectResult[]",
          components: [
            {
              name: "amount0",
              type: "uint128",
              internalType: "uint128",
            },
            {
              name: "amount1",
              type: "uint128",
              internalType: "uint128",
            },
          ],
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "collectProtocol7540FA9F",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "amount0",
          type: "uint128",
          internalType: "uint128",
        },
        {
          name: "amount1",
          type: "uint128",
          internalType: "uint128",
        },
        {
          name: "recipient",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint128",
          internalType: "uint128",
        },
        {
          name: "",
          type: "uint128",
          internalType: "uint128",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "collectSingleTo6D76575F",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "id",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "recipient",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "amount0",
          type: "uint128",
          internalType: "uint128",
        },
        {
          name: "amount1",
          type: "uint128",
          internalType: "uint128",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "createPoolD650E2D0",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "sqrtPriceX96",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "fee",
          type: "uint32",
          internalType: "uint32",
        },
        {
          name: "tickSpacing",
          type: "uint8",
          internalType: "uint8",
        },
        {
          name: "maxLiquidityPerTick",
          type: "uint128",
          internalType: "uint128",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "curTick181C6FD9",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "",
          type: "int32",
          internalType: "int32",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "decrPosition09293696",
      inputs: [
        {
          name: "id",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "amount0Min",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "amount1Min",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "amount0Max",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "amount1Max",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "enablePool579DA658",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "enabled",
          type: "bool",
          internalType: "bool",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "feeBB3CF608",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint32",
          internalType: "uint32",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "feeGrowthGlobal038B5665B",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "feeGrowthGlobal1A33A5A1B",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "feesOwed22F28DBD",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "id",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint128",
          internalType: "uint128",
        },
        {
          name: "",
          type: "uint128",
          internalType: "uint128",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "incrPositionC3AC7CAA",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "id",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "amount0Min",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "amount1Min",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "amount0Desired",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "amount1Desired",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "incrPositionPermit25468326E",
      inputs: [
        {
          name: "",
          type: "address",
          internalType: "address",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "bytes",
          internalType: "bytes",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "bytes",
          internalType: "bytes",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "mintPositionBC5B086D",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "lower",
          type: "int32",
          internalType: "int32",
        },
        {
          name: "upper",
          type: "int32",
          internalType: "int32",
        },
      ],
      outputs: [
        {
          name: "id",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "positionBalance4F32C7DB",
      inputs: [
        {
          name: "user",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "positionLiquidity8D11C045",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "id",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint128",
          internalType: "uint128",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "positionOwnerD7878480",
      inputs: [
        {
          name: "id",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "address",
          internalType: "address",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "positionTickLower2F77CCE1",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "id",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "int32",
          internalType: "int32",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "positionTickUpper67FD55BA",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "id",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "int32",
          internalType: "int32",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "quote2CD06B86E",
      inputs: [
        {
          name: "from",
          type: "address",
          internalType: "address",
        },
        {
          name: "to",
          type: "address",
          internalType: "address",
        },
        {
          name: "amount",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "minOut",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "quote72E2ADE7",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "zeroForOne",
          type: "bool",
          internalType: "bool",
        },
        {
          name: "amount",
          type: "int256",
          internalType: "int256",
        },
        {
          name: "priceLimit",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "setSqrtPriceFF4DB98C",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "price",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "sqrtPriceX967B8F5FC5",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "swap2ExactIn41203F1D",
      inputs: [
        {
          name: "_tokenA",
          type: "address",
          internalType: "address",
        },
        {
          name: "_tokenB",
          type: "address",
          internalType: "address",
        },
        {
          name: "_amount",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_minOut",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "swap2ExactInPermit236B2FDD8",
      inputs: [
        {
          name: "from",
          type: "address",
          internalType: "address",
        },
        {
          name: "to",
          type: "address",
          internalType: "address",
        },
        {
          name: "amount",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "minOut",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "nonce",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "deadline",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "sig",
          type: "bytes",
          internalType: "bytes",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "swap904369BE",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "zeroForOne",
          type: "bool",
          internalType: "bool",
        },
        {
          name: "amount",
          type: "int256",
          internalType: "int256",
        },
        {
          name: "priceLimit",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "swapIn32502CA71",
      inputs: [
        {
          name: "_token",
          type: "address",
          internalType: "address",
        },
        {
          name: "_amount",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_minOut",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "swapInPermit2CEAAB576",
      inputs: [
        {
          name: "_token",
          type: "address",
          internalType: "address",
        },
        {
          name: "_amount",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_minOut",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_nonce",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_deadline",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_maxAmount",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_sig",
          type: "bytes",
          internalType: "bytes",
        },
      ],
      outputs: [
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "swapOut5E08A399",
      inputs: [
        {
          name: "_token",
          type: "address",
          internalType: "address",
        },
        {
          name: "_amount",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_minOut",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "swapOutPermit23273373B",
      inputs: [
        {
          name: "_token",
          type: "address",
          internalType: "address",
        },
        {
          name: "_amount",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_minOut",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_nonce",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_deadline",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_maxAmount",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_sig",
          type: "bytes",
          internalType: "bytes",
        },
      ],
      outputs: [
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "swapPermit2EE84AD91",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "zeroForOne",
          type: "bool",
          internalType: "bool",
        },
        {
          name: "amount",
          type: "int256",
          internalType: "int256",
        },
        {
          name: "priceLimit",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "nonce",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "deadline",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "maxAmount",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "sig",
          type: "bytes",
          internalType: "bytes",
        },
      ],
      outputs: [
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "tickSpacing653FE28F",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint8",
          internalType: "uint8",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "transferPositionEEC7A3CD",
      inputs: [
        {
          name: "id",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "from",
          type: "address",
          internalType: "address",
        },
        {
          name: "to",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "updateEmergencyCouncil7D0C1C58",
      inputs: [
        {
          name: "newCouncil",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "updateNftManager9BDF41F6",
      inputs: [
        {
          name: "manager",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "updatePositionC7F1F740",
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "id",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "delta",
          type: "int128",
          internalType: "int128",
        },
      ],
      outputs: [
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
        {
          name: "",
          type: "int256",
          internalType: "int256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "event",
      name: "BurnPosition",
      inputs: [
        {
          name: "id",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "owner",
          type: "address",
          indexed: true,
          internalType: "address",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "CollectFees",
      inputs: [
        {
          name: "id",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "pool",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "to",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "amount0",
          type: "uint128",
          indexed: false,
          internalType: "uint128",
        },
        {
          name: "amount1",
          type: "uint128",
          indexed: false,
          internalType: "uint128",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "CollectProtocolFees",
      inputs: [
        {
          name: "pool",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "to",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "amount0",
          type: "uint128",
          indexed: false,
          internalType: "uint128",
        },
        {
          name: "amount1",
          type: "uint128",
          indexed: false,
          internalType: "uint128",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "MintPosition",
      inputs: [
        {
          name: "id",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "owner",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "pool",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "lower",
          type: "int32",
          indexed: false,
          internalType: "int32",
        },
        {
          name: "upper",
          type: "int32",
          indexed: false,
          internalType: "int32",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "NewPool",
      inputs: [
        {
          name: "token",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "fee",
          type: "uint32",
          indexed: true,
          internalType: "uint32",
        },
        {
          name: "decimals",
          type: "uint8",
          indexed: false,
          internalType: "uint8",
        },
        {
          name: "tickSpacing",
          type: "uint8",
          indexed: false,
          internalType: "uint8",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "Swap1",
      inputs: [
        {
          name: "user",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "pool",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "zeroForOne",
          type: "bool",
          indexed: false,
          internalType: "bool",
        },
        {
          name: "amount0",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
        {
          name: "amount1",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
        {
          name: "finalTick",
          type: "int32",
          indexed: false,
          internalType: "int32",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "Swap2",
      inputs: [
        {
          name: "user",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "from",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "to",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "amountIn",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
        {
          name: "amountOut",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
        {
          name: "fluidVolume",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
        {
          name: "finalTick0",
          type: "int32",
          indexed: false,
          internalType: "int32",
        },
        {
          name: "finalTick1",
          type: "int32",
          indexed: false,
          internalType: "int32",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "TransferPosition",
      inputs: [
        {
          name: "from",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "to",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "id",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "UpdatePositionLiquidity",
      inputs: [
        {
          name: "id",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "token0",
          type: "int256",
          indexed: false,
          internalType: "int256",
        },
        {
          name: "token1",
          type: "int256",
          indexed: false,
          internalType: "int256",
        },
      ],
      anonymous: false,
    },
  ],
} as const;
