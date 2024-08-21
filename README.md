

# Superposition audit details
- Total Prize Pool: $60,750 in USDC
  - HM awards: $38,880 in USDC
  - QA awards: $1,620 in USDC 
  - Judge awards: $7,000 in USDC
  - Scout awards: $750 in USDC
  - Validator awards: $3,500 USDC
  - Mitigation Review: $9,000 USDC (*Opportunity goes to top 3 backstage wardens based on placement in this audit who RSVP.*)
- [Read our guidelines for more details](https://docs.code4rena.com/roles/wardens)
- Starts August 22, 2024 20:00 UTC
- Ends September 12, 2024 20:00 UTC

## Automated Findings / Publicly Known Issues

The 4naly3er report can be found [here](https://github.com/code-423n4/2024-08-superposition/blob/main/4naly3er-report.md).



_Note for C4 wardens: Anything included in this `Automated Findings / Publicly Known Issues` section is considered a publicly known issue and is ineligible for awards._

* It is possible for someone to grief the protocol by creating a pool with bad configuration.
* It is possible for the permissioned account to do things to grief the protocol.



# Overview

[ ⭐️ SPONSORS: add info here ]

## Links

- **Previous audits:**  https://github.com/fluidity-money/long.so/tree/development/audits
- **Documentation:** https://docs.long.so
- **Website:** 
- **X/Twitter:** 🐺 CA: add a link to the sponsor's Twitter
- **Discord:** 🐺 CA: add a link to the sponsor's Discord

---

# Scope

*See [scope.txt](https://github.com/code-423n4/2024-08-superposition/blob/main/scope.txt)*

### Files in scope


| File   | Logic Contracts | Interfaces | nSLOC |
| ------ | --------------- | ---------- | ----- | 
| /pkg/sol/OwnershipNFTs.sol | 1| **** | 90 |
| /pkg/sol/SeawaterAMM.sol | 2| **** | 280 |
| /pkg/seawater/src/main.rs | ****| **** | 8 |
| /pkg/seawater/src/maths/mod.rs | ****| **** | 9 |
| /pkg/seawater/src/lib.rs | ****| **** | 925 |
| **Totals** | **3** | **** | **1312** | 

### Files out of scope

Any file not listed in the table above.

*See also [out_of_scope.txt](https://github.com/code-423n4/2024-08-superposition/blob/main/out_of_scope.txt)*

## Scoping Q &amp; A

### General questions



| Question                                | Answer                       |
| --------------------------------------- | ---------------------------- |
| ERC20 used by the protocol              |       Modern USDC (Arbitrum deployed)             |
| Test coverage                           | ✅ SCOUTS: Please populate this after running the test coverage command                          |
| ERC721 used  by the protocol            |            None              |
| ERC777 used by the protocol             |           None                |
| ERC1155 used by the protocol            |              None            |
| Chains the protocol will be deployed on | Superposition (Arbitrum Orbit chain)  |

### ERC20 token behaviors in scope

| Question                                                                                                                                                   | Answer |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| [Missing return values](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#missing-return-values)                                                      |   Out of scope  |
| [Fee on transfer](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#fee-on-transfer)                                                                  |  Out of scope  |
| [Balance changes outside of transfers](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#balance-modifications-outside-of-transfers-rebasingairdrops) | Out of scope    |
| [Upgradeability](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#upgradable-tokens)                                                                 |   Out of scope  |
| [Flash minting](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#flash-mintable-tokens)                                                              | In scope    |
| [Pausability](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#pausable-tokens)                                                                      | Out of scope    |
| [Approval race protections](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#approval-race-protections)                                              | Out of scope    |
| [Revert on approval to zero address](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#revert-on-approval-to-zero-address)                            | Out of scope    |
| [Revert on zero value approvals](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#revert-on-zero-value-approvals)                                    | Out of scope    |
| [Revert on zero value transfers](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#revert-on-zero-value-transfers)                                    | Out of scope    |
| [Revert on transfer to the zero address](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#revert-on-transfer-to-the-zero-address)                    | Out of scope    |
| [Revert on large approvals and/or transfers](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#revert-on-large-approvals--transfers)                  | Out of scope    |
| [Doesn't revert on failure](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#no-revert-on-failure)                                                   |  Out of scope   |
| [Multiple token addresses](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#revert-on-zero-value-transfers)                                          | Out of scope    |
| [Low decimals ( < 6)](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#low-decimals)                                                                 |   In scope  |
| [High decimals ( > 18)](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#high-decimals)                                                              | In scope    |
| [Blocklists](https://github.com/d-xo/weird-erc20?tab=readme-ov-file#tokens-with-blocklists)                                                                | Out of scope    |

### External integrations (e.g., Uniswap) behavior in scope:


| Question                                                  | Answer |
| --------------------------------------------------------- | ------ |
| Enabling/disabling fees (e.g. Blur disables/enables fees) | No   |
| Pausability (e.g. Uniswap pool gets paused)               |  No   |
| Upgradeability (e.g. Uniswap gets upgraded)               |   No  |


### EIP compliance checklist
N/A


# Additional context

## Main invariants

* Only the owner can modify their positions.
* Only valid tick ranges, and fee structures, are accessible.
* Users should be able to swap a reasonable amount determined by the appropriate conversion function.
* Users should receive a correct fee amount.
* We should follow Uniswap V3's math faithfully.

## Attack ideas (where to focus for bugs)
* Fee taking for ticks is possibly incorrect. We have a deployment that initially had bad behaviour with delta that we suspect is the cause of the issue that we replicated locally, but we haven't verified if that's not the case.
* Can people swap more than they should be able?
* Does the position taking function take more than it should?
* Is it possible to brick a pool with low liquidity?
* Are our ticks correct?


## All trusted roles in the protocol

[ ⭐️ SPONSORS: please fill in the description here ]


| Role                                    |     Description              |
| --------------------------------------- | ---------------------------- |
| Operator                                |                              |
| Emergency Council                       |                              |
| NFT manager                             |                              |

## Describe any novel or unique curve logic or mathematical models implemented in the contracts:

Concentrated liquidity algorithms based on Uniswap.


## Running tests

See [pkg/README](https://github.com/code-423n4/2024-08-superposition/blob/main/pkg/README.md#building) for a detailed explanation



First, run the nitro stylus node:
```bash
git clone https://github.com/OffchainLabs/nitro-testnode.git --recurse-submodules
cd nitro-testnode
git switch old-stylus
./test-node.bash --init
```

One of the lines of the output should like like this, note the port number (8547 in our case)
>  HTTP server started                      endpoint=[::]:8547 auth=false prefix= cors=* vhosts=*


Then run the following command:
```bash
https://github.com/code-423n4/2024-08-superposition
cd 2024-08-superposition/pkg

export FLU_SEAWATER_FUSDC_ADDR="0x0000000000000000000000000000000000000aab" \
    FLU_SEAWATER_PERMIT2_ADDR="0x0000000000000000000000000000000000000aaa" \
     FLU_SEAWATER_ADDR="0x0000000000000000000000000000000000000aac" \
    FLU_NFT_MANAGER_ADDR="0x0000000000000000000000000000000000000aad"
rustup target add wasm32-unknown-unknown
cargo install cargo-stylus
make seawater
# cargo install --force cargo-stylus-check
./tests.sh # this would test the rust files

yarn # or `npm i`
export SPN_GETH_URL="http://localhost:8547" # if the stylus node is running on a different port, replace 8547 with the right port
# this would test the solidity files
node --test --import tsx ethers-tests/seawater.ts  

```

Some of the tests are expected to fail:
1. `eli_incr_position` and `incr_position_fee_growth_tick` are issues that cropped up in production that we isolated by reproducing the remote state into our contracts. the production contract was deployed at one point with a change from the current version of this code that we believe may have contributed to causing this to happen.
2. `ethers_suite_uniswap_orchestrated_uniswap_two` is possibly indicative of an issue. it needs investigation whether this is correct behaviour
3. we left these tests for researchers to pore through and hopefully identify the root cause, the team hasn't succeeded so far.


To run code coverage
```bash
make coverage
```

✅ SCOUTS: Add a screenshot of your terminal showing the test coverage




## Miscellaneous
Employees of Superposition and employees' family members are ineligible to participate in this audit.

Code4rena's rules cannot be overridden by the contents of this README. In case of doubt, please check with C4 staff.
