# ✨ So you want to run an audit

This `README.md` contains a set of checklists for our audit collaboration.

Your audit will use two repos: 
- **an _audit_ repo** (this one), which is used for scoping your audit and for providing information to wardens
- **a _findings_ repo**, where issues are submitted (shared with you after the audit) 

Ultimately, when we launch the audit, this repo will be made public and will contain the smart contracts to be reviewed and all the information needed for audit participants. The findings repo will be made public after the audit report is published and your team has mitigated the identified issues.

Some of the checklists in this doc are for **C4 (🐺)** and some of them are for **you as the audit sponsor (⭐️)**.

---

# Audit setup

## 🐺 C4: Set up repos
- [ ] Create a new private repo named `YYYY-MM-sponsorname` using this repo as a template.
- [ ] Rename this repo to reflect audit date (if applicable)
- [ ] Rename audit H1 below
- [ ] Update pot sizes
  - [ ] Remove the "Bot race findings opt out" section if there's no bot race.
- [ ] Fill in start and end times in audit bullets below
- [ ] Add link to submission form in audit details below
- [ ] Add the information from the scoping form to the "Scoping Details" section at the bottom of this readme.
- [ ] Add matching info to the Code4rena site
- [ ] Add sponsor to this private repo with 'maintain' level access.
- [ ] Send the sponsor contact the url for this repo to follow the instructions below and add contracts here. 
- [ ] Delete this checklist.

# Repo setup

## ⭐️ Sponsor: Add code to this repo

- [ ] Create a PR to this repo with the below changes:
- [ ] Confirm that this repo is a self-contained repository with working commands that will build (at least) all in-scope contracts, and commands that will run tests producing gas reports for the relevant contracts.
- [ ] Please have final versions of contracts and documentation added/updated in this repo **no less than 48 business hours prior to audit start time.**
- [ ] Be prepared for a 🚨code freeze🚨 for the duration of the audit — important because it establishes a level playing field. We want to ensure everyone's looking at the same code, no matter when they look during the audit. (Note: this includes your own repo, since a PR can leak alpha to our wardens!)

## ⭐️ Sponsor: Repo checklist

- [ ] Modify the [Overview](#overview) section of this `README.md` file. Describe how your code is supposed to work with links to any relevent documentation and any other criteria/details that the auditors should keep in mind when reviewing. (Here are two well-constructed examples: [Ajna Protocol](https://github.com/code-423n4/2023-05-ajna) and [Maia DAO Ecosystem](https://github.com/code-423n4/2023-05-maia))
- [ ] Review the Gas award pool amount, if applicable. This can be adjusted up or down, based on your preference - just flag it for Code4rena staff so we can update the pool totals across all comms channels.
- [ ] Optional: pre-record a high-level overview of your protocol (not just specific smart contract functions). This saves wardens a lot of time wading through documentation.
- [ ] [This checklist in Notion](https://code4rena.notion.site/Key-info-for-Code4rena-sponsors-f60764c4c4574bbf8e7a6dbd72cc49b4#0cafa01e6201462e9f78677a39e09746) provides some best practices for Code4rena audit repos.

## ⭐️ Sponsor: Final touches
- [ ] Review and confirm the pull request created by the Scout (technical reviewer) who was assigned to your contest. *Note: any files not listed as "in scope" will be considered out of scope for the purposes of judging, even if the file will be part of the deployed contracts.*
- [ ] Check that images and other files used in this README have been uploaded to the repo as a file and then linked in the README using absolute path (e.g. `https://github.com/code-423n4/yourrepo-url/filepath.png`)
- [ ] Ensure that *all* links and image/file paths in this README use absolute paths, not relative paths
- [ ] Check that all README information is in markdown format (HTML does not render on Code4rena.com)
- [ ] Delete this checklist and all text above the line below when you're ready.

---

# Superposition audit details
- Total Prize Pool: $60750 in USDC
  - HM awards: $38880 in USDC
  - (remove this line if there is no Analysis pool) Analysis awards: XXX XXX USDC (Notion: Analysis pool)
  - QA awards: $1620 in USDC
  - (remove this line if there is no Bot race) Bot Race awards: XXX XXX USDC (Notion: Bot Race pool)
 
  - Judge awards: $7000 in USDC
  - Validator awards: XXX XXX USDC (Notion: Triage fee - final)
  - Scout awards: $750 in USDC
  - (this line can be removed if there is no mitigation) Mitigation Review: XXX XXX USDC (*Opportunity goes to top 3 backstage wardens based on placement in this audit who RSVP.*)
- [Read our guidelines for more details](https://docs.code4rena.com/roles/wardens)
- Starts August 21, 2024 20:00 UTC
- Ends September 11, 2024 20:00 UTC

## Automated Findings / Publicly Known Issues

The 4naly3er report can be found [here](https://github.com/code-423n4/2024-08-superposition/blob/main/4naly3er-report.md).



_Note for C4 wardens: Anything included in this `Automated Findings / Publicly Known Issues` section is considered a publicly known issue and is ineligible for awards._
## 🐺 C4: Begin Gist paste here (and delete this line)





# Scope

*See [scope.txt](https://github.com/code-423n4/2024-08-superposition/blob/main/scope.txt)*

### Files in scope


| File   | Logic Contracts | Interfaces | nSLOC | Purpose | Libraries used |
| ------ | --------------- | ---------- | ----- | -----   | ------------ |
| /pkg/sol/OwnershipNFTs.sol | 1| **** | 90 | ||
| /pkg/sol/SeawaterAMM.sol | 2| **** | 280 | ||
| /pkg/seawater/src/main.rs | ****| **** | 8 | ||
| /pkg/seawater/src/maths/mod.rs | ****| **** | 9 | ||
| /pkg/seawater/src/lib.rs | ****| **** | 925 | ||
| **Totals** | **3** | **** | **1312** | | |

### Files out of scope

*See [out_of_scope.txt](https://github.com/code-423n4/2024-08-superposition/blob/main/out_of_scope.txt)*

| File         |
| ------------ |
| ./cmd/faucet.superposition/graph/filter.go |
| ./cmd/faucet.superposition/graph/filter_test.go |
| ./cmd/faucet.superposition/graph/generated.go |
| ./cmd/faucet.superposition/graph/model/models_gen.go |
| ./cmd/faucet.superposition/graph/resolver.go |
| ./cmd/faucet.superposition/graph/schema.resolvers.go |
| ./cmd/faucet.superposition/graph/stakers.go |
| ./cmd/faucet.superposition/graph/verify-turnstile.go |
| ./cmd/faucet.superposition/lib/faucet/faucet.go |
| ./cmd/faucet.superposition/lib/faucet/request.go |
| ./cmd/faucet.superposition/main.go |
| ./cmd/faucet.superposition/tools.go |
| ./cmd/graphql.ethereum/graph/consts.go |
| ./cmd/graphql.ethereum/graph/generated.go |
| ./cmd/graphql.ethereum/graph/math.go |
| ./cmd/graphql.ethereum/graph/mocked.go |
| ./cmd/graphql.ethereum/graph/model/amount.go |
| ./cmd/graphql.ethereum/graph/model/liquidity-campaign.go |
| ./cmd/graphql.ethereum/graph/model/liquidity.go |
| ./cmd/graphql.ethereum/graph/model/models_gen.go |
| ./cmd/graphql.ethereum/graph/model/pagination.go |
| ./cmd/graphql.ethereum/graph/model/pool-config.go |
| ./cmd/graphql.ethereum/graph/model/price.go |
| ./cmd/graphql.ethereum/graph/model/price_test.go |
| ./cmd/graphql.ethereum/graph/model/seawater.go |
| ./cmd/graphql.ethereum/graph/model/swaps.go |
| ./cmd/graphql.ethereum/graph/model/token.go |
| ./cmd/graphql.ethereum/graph/model/wallet.go |
| ./cmd/graphql.ethereum/graph/resolver.go |
| ./cmd/graphql.ethereum/graph/schema.resolvers.go |
| ./cmd/graphql.ethereum/lib/erc20/erc20.go |
| ./cmd/graphql.ethereum/lib/erc20/erc20_test.go |
| ./cmd/graphql.ethereum/main.go |
| ./cmd/graphql.ethereum/pools.go |
| ./cmd/graphql.ethereum/tools.go |
| ./cmd/ingestor.logs.ethereum/func.go |
| ./cmd/ingestor.logs.ethereum/func_test.go |
| ./cmd/ingestor.logs.ethereum/main.go |
| ./cmd/ingestor.logs.ethereum/polling-db.go |
| ./cmd/ingestor.logs.ethereum/reflect.go |
| ./cmd/snapshot.ethereum/database.go |
| ./cmd/snapshot.ethereum/main.go |
| ./cmd/snapshot.ethereum/rpc.go |
| ./cmd/snapshot.ethereum/rpc_test.go |
| ./lib/config/config.go |
| ./lib/config/defaults.go |
| ./lib/config/pools.go |
| ./lib/events/erc20/erc20.go |
| ./lib/events/erc20/types.go |
| ./lib/events/events.go |
| ./lib/events/leo/leo.go |
| ./lib/events/leo/leo_test.go |
| ./lib/events/leo/types.go |
| ./lib/events/seawater/seawater.go |
| ./lib/events/seawater/seawater_test.go |
| ./lib/events/seawater/types.go |
| ./lib/events/thirdweb/thirdweb.go |
| ./lib/events/thirdweb/types.go |
| ./lib/features/features.go |
| ./lib/features/features_test.go |
| ./lib/features/list.go |
| ./lib/heartbeat/heartbeat.go |
| ./lib/math/concentrated-liq.go |
| ./lib/math/concentrated-liq_test.go |
| ./lib/math/decimals.go |
| ./lib/math/decimals_test.go |
| ./lib/setup/setup.go |
| ./lib/types/erc20/erc20.go |
| ./lib/types/seawater/classifications.go |
| ./lib/types/seawater/seawater.go |
| ./lib/types/types.go |
| ./pkg/leo/src/calldata.rs |
| ./pkg/leo/src/erc20.rs |
| ./pkg/leo/src/error.rs |
| ./pkg/leo/src/events.rs |
| ./pkg/leo/src/host.rs |
| ./pkg/leo/src/immutables.rs |
| ./pkg/leo/src/lib.rs |
| ./pkg/leo/src/main.rs |
| ./pkg/leo/src/maths.rs |
| ./pkg/leo/src/nft_manager.rs |
| ./pkg/leo/src/seawater.rs |
| ./pkg/leo/tests/lib.rs |
| ./pkg/seawater/src/host_test_shims.rs |
| ./pkg/seawater/src/host_test_utils.rs |
| ./pkg/seawater/src/pool.rs |
| ./pkg/seawater/src/test_shims.rs |
| ./pkg/seawater/src/test_utils.rs |
| ./pkg/seawater/tests/lib.rs |
| ./pkg/seawater/tests/pools.rs |
| ./pkg/seawater/tests/reference/full_math.rs |
| ./pkg/seawater/tests/reference/mod.rs |
| ./pkg/seawater/tests/reference/tick_math.rs |
| ./pkg/seawater/tests/reference_impls.rs |
| ./pkg/sol/Faucet.sol |
| ./pkg/sol/IERC20.sol |
| ./pkg/sol/IERC721Metadata.sol |
| ./pkg/sol/IERC721TokenReceiver.sol |
| ./pkg/sol/IFaucet.sol |
| ./pkg/sol/ILeoEvents.sol |
| ./pkg/sol/ISeawater.sol |
| ./pkg/sol/ISeawaterAMM.sol |
| ./pkg/sol/ISeawaterEvents.sol |
| ./pkg/sol/ISeawaterExecutors.sol |
| ./pkg/sol/ISeawaterMigrations.sol |
| ./pkg/test/LightweightERC20.sol |
| ./pkg/test/permit2.sol |
| ./tools/ethereum-selector-mine.go |
| Totals: 108 |

