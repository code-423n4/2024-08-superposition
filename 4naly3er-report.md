# Report


## Gas Optimizations


| |Issue|Instances|
|-|:-|:-:|
| [GAS-1](#GAS-1) | Using bools for storage incurs overhead | 1 |
| [GAS-2](#GAS-2) | Use calldata instead of memory for function arguments that do not get mutated | 8 |
| [GAS-3](#GAS-3) | For Operations that will not overflow, you could use unchecked | 105 |
| [GAS-4](#GAS-4) | Use Custom Errors instead of Revert Strings to save Gas | 8 |
| [GAS-5](#GAS-5) | Avoid contract existence checks by using low level calls | 5 |
| [GAS-6](#GAS-6) | State variables only set in the constructor should be declared `immutable` | 4 |
| [GAS-7](#GAS-7) | Functions guaranteed to revert when called by normal users can be marked `payable` | 1 |
| [GAS-8](#GAS-8) | `internal` functions not called by the contract should be removed | 1 |
### <a name="GAS-1"></a>[GAS-1] Using bools for storage incurs overhead
Use uint256(1) and uint256(2) for true/false to avoid a Gwarmaccess (100 gas), and to avoid Gsset (20000 gas) when changing from ‘false’ to ‘true’, after having been ‘true’ in the past. See [source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/58f635312aa21f947cae5f8578638a85aa2519f5/contracts/security/ReentrancyGuard.sol#L23-L27).

*Instances (1)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

36:     mapping(address => mapping(address => bool)) public isApprovedForAll;

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

### <a name="GAS-2"></a>[GAS-2] Use calldata instead of memory for function arguments that do not get mutated
When a function with a `memory` array is called externally, the `abi.decode()` step has to use a for-loop to copy each index of the `calldata` to the `memory` index. Each iteration of this for-loop costs at least 60 gas (i.e. `60 * <mem_array>.length`). Using `calldata` directly bypasses this loop. 

If the array is passed to an `internal` function which passes the array to another internal function where the array is modified and therefore `memory` is used in the `external` call, it's still more gas-efficient to use `calldata` when the `external` function uses modifiers, since the modifiers may prevent the internal functions from being called. Structs have the same overhead as an array of length one. 

 *Saves 60 gas per instance*

*Instances (8)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

238:         bytes memory /* sig */

256:         bytes memory /* sig */

281:     function swapInPermit2CEAAB576(address token, uint256 amountIn, uint256 minOut, uint256 nonce, uint256 deadline, uint256 maxAmount, bytes memory sig) external returns (int256, int256) {

322:     function swapOutPermit23273373B(address token, uint256 amountIn, uint256 minOut, uint256 nonce, uint256 deadline, uint256 maxAmount, bytes memory sig) external returns (int256, int256) {

448:         address[] memory /* pools */,

449:         uint256[] memory /* ids */

495:         bytes memory /* sig0 */,

499:         bytes memory /* sig1 */

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="GAS-3"></a>[GAS-3] For Operations that will not overflow, you could use unchecked

*Instances (105)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

4: import "./IERC721Metadata.sol";

5: import "./ISeawaterAMM.sol";

7: import "./IERC721TokenReceiver.sol";

122:         bytes calldata /* _data */

153:         bytes calldata /* _data */

182:     function tokenURI(uint256 /* _tokenId */) external view returns (string memory) {

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

```solidity
File: ./pkg/sol/SeawaterAMM.sol

4: import "./ISeawaterExecutors.sol";

6: import "./ISeawaterAMM.sol";

12: bytes32 constant EXECUTOR_SWAP_SLOT = bytes32(uint256(keccak256("seawater.impl.swap")) - 1);

15: bytes32 constant EXECUTOR_SWAP_PERMIT2_SLOT = bytes32(uint256(keccak256("seawater.impl.swap_permit2")) - 1);

18: bytes32 constant EXECUTOR_QUOTE_SLOT = bytes32(uint256(keccak256("seawater.impl.quote")) - 1);

21: bytes32 constant EXECUTOR_POSITION_SLOT = bytes32(uint256(keccak256("seawater.impl.position")) - 1);

24: bytes32 constant EXECUTOR_UPDATE_POSITION_SLOT = bytes32(uint256(keccak256("seawater.impl.update_position")) - 1);

27: bytes32 constant EXECUTOR_ADMIN_SLOT = bytes32(uint256(keccak256("seawater.impl.admin")) - 1);

30: bytes32 constant EXECUTOR_FALLBACK_SLOT = bytes32(uint256(keccak256("seawater.impl.fallback")) - 1);

33: bytes32 constant PROXY_ADMIN_SLOT = bytes32(uint256(keccak256("seawater.role.proxy.admin")) - 1);

161:         address /* token */,

162:         uint256 /* sqrtPriceX96 */,

163:         uint32 /* fee */,

164:         uint8 /* tickSpacing */,

165:         uint128 /* maxLiquidityPerTick */

172:         address /* pool */,

173:         uint128 /* amount0 */,

174:         uint128 /* amount1 */,

175:         address /* recipient */

182:         address /* pool */,

183:         bool /* enabled */

190:         address /* enabler */,

191:         bool /* enabled */

197:     function setSqrtPriceFF4DB98C(address /* pool */, uint256 /* price */) external {

202:     function updateNftManager9BDF41F6(address /* manager */) external {

207:     function updateEmergencyCouncil7D0C1C58(address /* council */) external {

214:     function swap904369BE(address /* pool */, bool /* zeroForOne */, int256 /* amount */, uint256 /* priceLimit */) external returns (int256, int256) {

219:     function quote72E2ADE7(address /* pool */, bool /* zeroForOne */, int256 /* amount */, uint256 /* priceLimit */) external {

225:     function quote2CD06B86E(address /* to */, address /* from */, uint256 /* amount */, uint256 /* minOut*/) external {

231:         address /* pool */,

232:         bool /* zeroForOne */,

233:         int256 /* amount */,

234:         uint256 /* priceLimit */,

235:         uint256 /* nonce */,

236:         uint256 /* deadline */,

237:         uint256 /* maxAmount */,

238:         bytes memory /* sig */

244:     function swap2ExactIn41203F1D(address /* tokenA */, address /* tokenB */, uint256 /* amountIn */, uint256 /* minAmountOut */) external returns (uint256, uint256) {

250:         address /* from */,

251:         address /* to */,

252:         uint256 /* amount */,

253:         uint256 /* minOut */,

254:         uint256 /* nonce */,

255:         uint256 /* deadline */,

256:         bytes memory /* sig */

276:         require(-swapAmountOut >= int256(minOut), "min out not reached!");

299:         require(-swapAmountOut >= int256(minOut), "min out not reached!");

346:     function mintPositionBC5B086D(address /* token */, int32 /* lower */, int32 /* upper */) external returns (uint256 /* id */) {

351:     function burnPositionAE401070(uint256 /* id */) external {

356:     function positionOwnerD7878480(uint256 /* id */) external returns (address) {

363:         uint256 /* id */,

364:         address /* from */,

365:         address /* to */

371:     function positionBalance4F32C7DB(address /* user */) external returns (uint256) {

377:         address /* pool */,

378:         uint256 /* id */

385:         address /* pool */,

386:         uint256 /* id */

393:         address /* pool */,

394:         uint256 /* id */

400:     function sqrtPriceX967B8F5FC5(address /* pool */) external returns (uint256) {

406:         address /* pool */,

407:         uint256 /* position */

413:     function curTick181C6FD9(address /* pool */) external returns (int32) {

418:     function tickSpacing653FE28F(address /* pool */) external returns (uint8) {

423:     function feeBB3CF608(address /* pool */) external returns (uint32) {

428:     function feeGrowthGlobal038B5665B(address /* pool */) external returns (uint256) {

433:     function feeGrowthGlobal1A33A5A1B(address /*pool */) external returns (uint256) {

439:         address /* pool */,

440:         uint256 /* id */,

441:         address /* recipient */

448:         address[] memory /* pools */,

449:         uint256[] memory /* ids */

456:         address /* pool */,

457:         uint256 /* id */,

458:         int128 /* delta */

465:         address /* pool */,

466:         uint256 /* id */,

467:         uint256 /* amount0Min */,

468:         uint256 /* amount1Min */,

469:         uint256 /* amount0Desired */,

470:         uint256 /* amount1Desired */

477:         uint256 /* id */,

478:         uint256 /* amount0Min */,

479:         uint256 /* amount1Min */,

480:         uint256 /* amount0Max */,

481:         uint256 /* amount1Max */

488:         address /* token */,

489:         uint256 /* id */,

490:         uint256 /* amount0Min */,

491:         uint256 /* amount1Min */,

492:         uint256 /* nonce0 */,

493:         uint256 /* deadline0 */,

494:         uint256 /* amount0Max */,

495:         bytes memory /* sig0 */,

496:         uint256 /* nonce1 */,

497:         uint256 /* deadline1 */,

498:         uint256 /* amount1Max */,

499:         bytes memory /* sig1 */

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="GAS-4"></a>[GAS-4] Use Custom Errors instead of Revert Strings to save Gas
Custom errors are available from solidity version 0.8.4. Custom errors save [**~50 gas**](https://gist.github.com/IllIllI000/ad1bd0d29a0101b25e57c293b4b0c746) each time they're hit by [avoiding having to allocate and store the revert string](https://blog.soliditylang.org/2021/04/21/custom-errors/#errors-in-depth). Not defining the strings also save deployment gas

Additionally, custom errors can be used inside and outside of contracts (including interfaces and libraries).

Source: <https://blog.soliditylang.org/2021/04/21/custom-errors/>:

> Starting from [Solidity v0.8.4](https://github.com/ethereum/solidity/releases/tag/v0.8.4), there is a convenient and gas-efficient way to explain to users why an operation failed through the use of custom errors. Until now, you could already use strings to give more information about failures (e.g., `revert("Insufficient funds.");`), but they are rather expensive, especially when it comes to deploy cost, and it is difficult to use dynamic information in them.

Consider replacing **all revert strings** with custom errors in the solution, and particularly those that have multiple occurrences:

*Instances (8)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

59:         require(ok, "position owner revert");

105:         require(isAllowed, "not allowed");

106:         require(ownerOf(_tokenId) == _from, "_from is not the owner!");

176:         require(ok, "position balance revert");

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

```solidity
File: ./pkg/sol/SeawaterAMM.sol

276:         require(-swapAmountOut >= int256(minOut), "min out not reached!");

299:         require(-swapAmountOut >= int256(minOut), "min out not reached!");

317:         require(swapAmountOut >= int256(minOut), "min out not reached!");

339:         require(swapAmountOut >= int256(minOut), "min out not reached!");

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="GAS-5"></a>[GAS-5] Avoid contract existence checks by using low level calls
Prior to 0.8.10 the compiler inserted extra code, including `EXTCODESIZE` (**100 gas**), to check for contract existence for external function calls. In more recent solidity versions, the compiler will not insert these checks if the external call has a return value. Similar behavior can be achieved in earlier versions by using low-level calls, since low level calls never check for contract existence

*Instances (5)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

92:         (bool success, bytes memory data) = _getExecutorAdmin().delegatecall(abi.encodeCall(

263:         (bool success, bytes memory data) = _getExecutorSwap().delegatecall(abi.encodeCall(

282:         (bool success, bytes memory data) = _getExecutorSwapPermit2().delegatecall(abi.encodeCall(

305:         (bool success, bytes memory data) = _getExecutorSwap().delegatecall(abi.encodeCall(

323:         (bool success, bytes memory data) = _getExecutorSwapPermit2().delegatecall(abi.encodeCall(

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="GAS-6"></a>[GAS-6] State variables only set in the constructor should be declared `immutable`
Variables only set in the constructor and never edited afterwards should be marked as immutable, as it would avoid the expensive storage-writing operation in the constructor (around **20 000 gas** per variable) and replace the expensive storage-reading operations (around **2100 gas** per reading) to a less expensive value reading (**3 gas**)

*Instances (4)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

44:         name = _name;

45:         symbol = _symbol;

46:         TOKEN_URI = _tokenURI;

47:         SEAWATER = _seawater;

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

### <a name="GAS-7"></a>[GAS-7] Functions guaranteed to revert when called by normal users can be marked `payable`
If a function modifier such as `onlyOwner` is used, the function will revert if a normal user tries to pay the function. Marking the function as `payable` will lower the gas cost for legitimate callers because the compiler will not include checks for whether a payment was provided.

*Instances (1)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

104:     function updateProxyAdmin(address newAdmin) public onlyProxyAdmin {

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="GAS-8"></a>[GAS-8] `internal` functions not called by the contract should be removed
If the functions are required by an interface, the contract should inherit from that interface and use the `override` keyword

*Instances (1)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

42:     function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)


## Non Critical Issues


| |Issue|Instances|
|-|:-|:-:|
| [NC-1](#NC-1) | Replace `abi.encodeWithSignature` and `abi.encodeWithSelector` with `abi.encodeCall` which keeps the code typo/type safe | 2 |
| [NC-2](#NC-2) | Array indices should be referenced via `enum`s rather than via numeric literals | 7 |
| [NC-3](#NC-3) | `constant`s should be defined rather than using magic numbers | 5 |
| [NC-4](#NC-4) | Control structures do not follow the Solidity Style Guide | 7 |
| [NC-5](#NC-5) | Default Visibility for constants | 8 |
| [NC-6](#NC-6) | Duplicated `require()`/`revert()` Checks Should Be Refactored To A Modifier Or Function | 9 |
| [NC-7](#NC-7) | Function ordering does not follow the Solidity style guide | 2 |
| [NC-8](#NC-8) | Functions should not be longer than 50 lines | 37 |
| [NC-9](#NC-9) | Lack of checks in setters | 17 |
| [NC-10](#NC-10) | Lines are too long | 3 |
| [NC-11](#NC-11) | Missing Event for critical parameters change | 13 |
| [NC-12](#NC-12) | NatSpec is completely non-existent on functions that should have them | 1 |
| [NC-13](#NC-13) | Incomplete NatSpec: `@param` is missing on actually documented functions | 1 |
| [NC-14](#NC-14) | Use a `modifier` instead of a `require/if` statement for a special `msg.sender` actor | 1 |
| [NC-15](#NC-15) | Consider using named mappings | 2 |
| [NC-16](#NC-16) | `require()` / `revert()` statements should have descriptive reason strings | 2 |
| [NC-17](#NC-17) | Take advantage of Custom Error's return value property | 1 |
| [NC-18](#NC-18) | Contract does not follow the Solidity style guide's suggested layout ordering | 1 |
| [NC-19](#NC-19) | Internal and private variables and functions names should begin with an underscore | 2 |
| [NC-20](#NC-20) | `public` functions not called by the contract should be declared `external` instead | 2 |
### <a name="NC-1"></a>[NC-1] Replace `abi.encodeWithSignature` and `abi.encodeWithSelector` with `abi.encodeCall` which keeps the code typo/type safe
When using `abi.encodeWithSignature`, it is possible to include a typo for the correct function signature.
When using `abi.encodeWithSignature` or `abi.encodeWithSelector`, it is also possible to provide parameters that are not of the correct type for the function.

To avoid these pitfalls, it would be best to use [`abi.encodeCall`](https://solidity-by-example.org/abi-encode/) instead.

*Instances (2)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

55:         (bool ok, bytes memory rc) = address(SEAWATER).staticcall(abi.encodeWithSelector(

172:         (bool ok, bytes memory rc) = address(SEAWATER).staticcall(abi.encodeWithSelector(

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

### <a name="NC-2"></a>[NC-2] Array indices should be referenced via `enum`s rather than via numeric literals

*Instances (7)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

507:         require(msg.data[0] == 0);

509:         if (uint8(msg.data[2]) == 0) directDelegate(_getExecutorSwap());

511:         else if (uint8(msg.data[2]) == 1) directDelegate(_getExecutorUpdatePosition());

513:         else if (uint8(msg.data[2]) == 2) directDelegate(_getExecutorPosition());

515:         else if (uint8(msg.data[2]) == 3) directDelegate(_getExecutorAdmin());

517:         else if (uint8(msg.data[2]) == 4) directDelegate(_getExecutorSwapPermit2());

519:         else if (uint8(msg.data[2]) == 5) directDelegate(_getExecutorQuote());

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-3"></a>[NC-3] `constant`s should be defined rather than using magic numbers
Even [assembly](https://github.com/code-423n4/2022-05-opensea-seaport/blob/9d7ce4d08bf3c3010304a0476a785c70c0e90ae7/contracts/lib/TokenTransferrer.sol#L35-L39) can benefit from using readable constants instead of hex/numeric literals

*Instances (5)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

506:         require(msg.data.length > 3);

513:         else if (uint8(msg.data[2]) == 2) directDelegate(_getExecutorPosition());

515:         else if (uint8(msg.data[2]) == 3) directDelegate(_getExecutorAdmin());

517:         else if (uint8(msg.data[2]) == 4) directDelegate(_getExecutorSwapPermit2());

519:         else if (uint8(msg.data[2]) == 5) directDelegate(_getExecutorQuote());

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-4"></a>[NC-4] Control structures do not follow the Solidity Style Guide
See the [control structures](https://docs.soliditylang.org/en/latest/style-guide.html#control-structures) section of the Solidity Style Guide

*Instances (7)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

80:         if (_to.code.length == 0) return;

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

```solidity
File: ./pkg/sol/SeawaterAMM.sol

509:         if (uint8(msg.data[2]) == 0) directDelegate(_getExecutorSwap());

511:         else if (uint8(msg.data[2]) == 1) directDelegate(_getExecutorUpdatePosition());

513:         else if (uint8(msg.data[2]) == 2) directDelegate(_getExecutorPosition());

515:         else if (uint8(msg.data[2]) == 3) directDelegate(_getExecutorAdmin());

517:         else if (uint8(msg.data[2]) == 4) directDelegate(_getExecutorSwapPermit2());

519:         else if (uint8(msg.data[2]) == 5) directDelegate(_getExecutorQuote());

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-5"></a>[NC-5] Default Visibility for constants
Some constants are using the default visibility. For readability, consider explicitly declaring them as `internal`.

*Instances (8)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

12: bytes32 constant EXECUTOR_SWAP_SLOT = bytes32(uint256(keccak256("seawater.impl.swap")) - 1);

15: bytes32 constant EXECUTOR_SWAP_PERMIT2_SLOT = bytes32(uint256(keccak256("seawater.impl.swap_permit2")) - 1);

18: bytes32 constant EXECUTOR_QUOTE_SLOT = bytes32(uint256(keccak256("seawater.impl.quote")) - 1);

21: bytes32 constant EXECUTOR_POSITION_SLOT = bytes32(uint256(keccak256("seawater.impl.position")) - 1);

24: bytes32 constant EXECUTOR_UPDATE_POSITION_SLOT = bytes32(uint256(keccak256("seawater.impl.update_position")) - 1);

27: bytes32 constant EXECUTOR_ADMIN_SLOT = bytes32(uint256(keccak256("seawater.impl.admin")) - 1);

30: bytes32 constant EXECUTOR_FALLBACK_SLOT = bytes32(uint256(keccak256("seawater.impl.fallback")) - 1);

33: bytes32 constant PROXY_ADMIN_SLOT = bytes32(uint256(keccak256("seawater.role.proxy.admin")) - 1);

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-6"></a>[NC-6] Duplicated `require()`/`revert()` Checks Should Be Refactored To A Modifier Or Function

*Instances (9)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

97:         require(success, string(data));

272:         require(success, string(data));

276:         require(-swapAmountOut >= int256(minOut), "min out not reached!");

295:         require(success, string(data));

299:         require(-swapAmountOut >= int256(minOut), "min out not reached!");

314:         require(success, string(data));

317:         require(swapAmountOut >= int256(minOut), "min out not reached!");

336:         require(success, string(data));

339:         require(swapAmountOut >= int256(minOut), "min out not reached!");

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-7"></a>[NC-7] Function ordering does not follow the Solidity style guide
According to the [Solidity style guide](https://docs.soliditylang.org/en/v0.8.17/style-guide.html#order-of-functions), functions should be laid out in the following order :`constructor()`, `receive()`, `fallback()`, `external`, `public`, `internal`, `private`, but the cases below do not follow this pattern

*Instances (2)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

1: 
   Current order:
   public ownerOf
   internal _onTransferReceived
   internal _requireAuthorised
   internal _transfer
   external transferFrom
   external transferFrom
   external safeTransferFrom
   external safeTransferFrom
   external approve
   external setApprovalForAll
   external balanceOf
   external tokenURI
   
   Suggested order:
   external transferFrom
   external transferFrom
   external safeTransferFrom
   external safeTransferFrom
   external approve
   external setApprovalForAll
   external balanceOf
   external tokenURI
   public ownerOf
   internal _onTransferReceived
   internal _requireAuthorised
   internal _transfer

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

```solidity
File: ./pkg/sol/SeawaterAMM.sol

1: 
   Current order:
   internal getAddressSlot
   public updateProxyAdmin
   public updateExecutors
   internal directDelegate
   external createPoolD650E2D0
   external collectProtocol7540FA9F
   external enablePool579DA658
   external authoriseEnabler5B17C274
   external setSqrtPriceFF4DB98C
   external updateNftManager9BDF41F6
   external updateEmergencyCouncil7D0C1C58
   external swap904369BE
   external quote72E2ADE7
   external quote2CD06B86E
   external swapPermit2EE84AD91
   external swap2ExactIn41203F1D
   external swap2ExactInPermit236B2FDD8
   external swapIn32502CA71
   external swapInPermit2CEAAB576
   external swapOut5E08A399
   external swapOutPermit23273373B
   external mintPositionBC5B086D
   external burnPositionAE401070
   external positionOwnerD7878480
   external transferPositionEEC7A3CD
   external positionBalance4F32C7DB
   external positionLiquidity8D11C045
   external positionTickLower2F77CCE1
   external positionTickUpper67FD55BA
   external sqrtPriceX967B8F5FC5
   external feesOwed22F28DBD
   external curTick181C6FD9
   external tickSpacing653FE28F
   external feeBB3CF608
   external feeGrowthGlobal038B5665B
   external feeGrowthGlobal1A33A5A1B
   external collectSingleTo6D76575F
   external collect7F21947C
   external updatePositionC7F1F740
   external incrPositionC3AC7CAA
   external decrPosition09293696
   external incrPositionPermit25468326E
   internal _getExecutorSwap
   internal _getExecutorSwapPermit2
   internal _getExecutorQuote
   internal _getExecutorPosition
   internal _getExecutorUpdatePosition
   internal _getExecutorAdmin
   internal _getExecutorFallback
   internal _setProxyAdmin
   internal _setProxies
   
   Suggested order:
   external createPoolD650E2D0
   external collectProtocol7540FA9F
   external enablePool579DA658
   external authoriseEnabler5B17C274
   external setSqrtPriceFF4DB98C
   external updateNftManager9BDF41F6
   external updateEmergencyCouncil7D0C1C58
   external swap904369BE
   external quote72E2ADE7
   external quote2CD06B86E
   external swapPermit2EE84AD91
   external swap2ExactIn41203F1D
   external swap2ExactInPermit236B2FDD8
   external swapIn32502CA71
   external swapInPermit2CEAAB576
   external swapOut5E08A399
   external swapOutPermit23273373B
   external mintPositionBC5B086D
   external burnPositionAE401070
   external positionOwnerD7878480
   external transferPositionEEC7A3CD
   external positionBalance4F32C7DB
   external positionLiquidity8D11C045
   external positionTickLower2F77CCE1
   external positionTickUpper67FD55BA
   external sqrtPriceX967B8F5FC5
   external feesOwed22F28DBD
   external curTick181C6FD9
   external tickSpacing653FE28F
   external feeBB3CF608
   external feeGrowthGlobal038B5665B
   external feeGrowthGlobal1A33A5A1B
   external collectSingleTo6D76575F
   external collect7F21947C
   external updatePositionC7F1F740
   external incrPositionC3AC7CAA
   external decrPosition09293696
   external incrPositionPermit25468326E
   public updateProxyAdmin
   public updateExecutors
   internal getAddressSlot
   internal directDelegate
   internal _getExecutorSwap
   internal _getExecutorSwapPermit2
   internal _getExecutorQuote
   internal _getExecutorPosition
   internal _getExecutorUpdatePosition
   internal _getExecutorAdmin
   internal _getExecutorFallback
   internal _setProxyAdmin
   internal _setProxies

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-8"></a>[NC-8] Functions should not be longer than 50 lines
Overly complex code can make understanding functionality more difficult, try to further modularize your code to ensure readability 

*Instances (37)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

54:     function ownerOf(uint256 _tokenId) public view returns (address) {

98:     function _requireAuthorised(address _from, uint256 _tokenId) internal view {

160:     function approve(address _approved, uint256 _tokenId) external payable {

166:     function setApprovalForAll(address _operator, bool _approved) external {

171:     function balanceOf(address _spender) external view returns (uint256) {

182:     function tokenURI(uint256 /* _tokenId */) external view returns (string memory) {

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

```solidity
File: ./pkg/sol/SeawaterAMM.sol

42:     function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {

104:     function updateProxyAdmin(address newAdmin) public onlyProxyAdmin {

197:     function setSqrtPriceFF4DB98C(address /* pool */, uint256 /* price */) external {

202:     function updateNftManager9BDF41F6(address /* manager */) external {

207:     function updateEmergencyCouncil7D0C1C58(address /* council */) external {

214:     function swap904369BE(address /* pool */, bool /* zeroForOne */, int256 /* amount */, uint256 /* priceLimit */) external returns (int256, int256) {

219:     function quote72E2ADE7(address /* pool */, bool /* zeroForOne */, int256 /* amount */, uint256 /* priceLimit */) external {

225:     function quote2CD06B86E(address /* to */, address /* from */, uint256 /* amount */, uint256 /* minOut*/) external {

244:     function swap2ExactIn41203F1D(address /* tokenA */, address /* tokenB */, uint256 /* amountIn */, uint256 /* minAmountOut */) external returns (uint256, uint256) {

262:     function swapIn32502CA71(address token, uint256 amountIn, uint256 minOut) external returns (int256, int256) {

281:     function swapInPermit2CEAAB576(address token, uint256 amountIn, uint256 minOut, uint256 nonce, uint256 deadline, uint256 maxAmount, bytes memory sig) external returns (int256, int256) {

304:     function swapOut5E08A399(address token, uint256 amountIn, uint256 minOut) external returns (int256, int256) {

322:     function swapOutPermit23273373B(address token, uint256 amountIn, uint256 minOut, uint256 nonce, uint256 deadline, uint256 maxAmount, bytes memory sig) external returns (int256, int256) {

346:     function mintPositionBC5B086D(address /* token */, int32 /* lower */, int32 /* upper */) external returns (uint256 /* id */) {

351:     function burnPositionAE401070(uint256 /* id */) external {

356:     function positionOwnerD7878480(uint256 /* id */) external returns (address) {

371:     function positionBalance4F32C7DB(address /* user */) external returns (uint256) {

400:     function sqrtPriceX967B8F5FC5(address /* pool */) external returns (uint256) {

413:     function curTick181C6FD9(address /* pool */) external returns (int32) {

418:     function tickSpacing653FE28F(address /* pool */) external returns (uint8) {

423:     function feeBB3CF608(address /* pool */) external returns (uint32) {

428:     function feeGrowthGlobal038B5665B(address /* pool */) external returns (uint256) {

433:     function feeGrowthGlobal1A33A5A1B(address /*pool */) external returns (uint256) {

527:     function _getExecutorSwap() internal view returns (address) {

530:     function _getExecutorSwapPermit2() internal view returns (address) {

533:     function _getExecutorQuote() internal view returns (address) {

536:     function _getExecutorPosition() internal view returns (address) {

539:     function _getExecutorUpdatePosition() internal view returns (address) {

542:     function _getExecutorAdmin() internal view returns (address) {

545:     function _getExecutorFallback() internal view returns (address) {

549:     function _setProxyAdmin(address newAdmin) internal {

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-9"></a>[NC-9] Lack of checks in setters
Be it sanity checks (like checks against `0`-values) or initial setting checks: it's best for Setter functions to have them

*Instances (17)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

166:     function setApprovalForAll(address _operator, bool _approved) external {
             isApprovedForAll[msg.sender][_operator] = _approved;

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

```solidity
File: ./pkg/sol/SeawaterAMM.sol

104:     function updateProxyAdmin(address newAdmin) public onlyProxyAdmin {
             _setProxyAdmin(newAdmin);

104:     function updateProxyAdmin(address newAdmin) public onlyProxyAdmin {
             _setProxyAdmin(newAdmin);

115:     function updateExecutors(
             ISeawaterExecutorSwap executorSwap,
             ISeawaterExecutorSwapPermit2 executorSwapPermit2,
             ISeawaterExecutorQuote executorQuote,
             ISeawaterExecutorPosition executorPosition,
             ISeawaterExecutorUpdatePosition executorUpdatePosition,
             ISeawaterExecutorAdmin executorAdmin,
             ISeawaterExecutorFallback executorFallback
         ) public onlyProxyAdmin {
             _setProxies(executorSwap, executorSwapPermit2, executorQuote, executorPosition, executorUpdatePosition, executorAdmin, executorFallback);

115:     function updateExecutors(
             ISeawaterExecutorSwap executorSwap,
             ISeawaterExecutorSwapPermit2 executorSwapPermit2,
             ISeawaterExecutorQuote executorQuote,
             ISeawaterExecutorPosition executorPosition,
             ISeawaterExecutorUpdatePosition executorUpdatePosition,
             ISeawaterExecutorAdmin executorAdmin,
             ISeawaterExecutorFallback executorFallback
         ) public onlyProxyAdmin {
             _setProxies(executorSwap, executorSwapPermit2, executorQuote, executorPosition, executorUpdatePosition, executorAdmin, executorFallback);

197:     function setSqrtPriceFF4DB98C(address /* pool */, uint256 /* price */) external {
             directDelegate(_getExecutorAdmin());

197:     function setSqrtPriceFF4DB98C(address /* pool */, uint256 /* price */) external {
             directDelegate(_getExecutorAdmin());

202:     function updateNftManager9BDF41F6(address /* manager */) external {
             directDelegate(_getExecutorAdmin());

202:     function updateNftManager9BDF41F6(address /* manager */) external {
             directDelegate(_getExecutorAdmin());

207:     function updateEmergencyCouncil7D0C1C58(address /* council */) external {
             directDelegate(_getExecutorAdmin());

207:     function updateEmergencyCouncil7D0C1C58(address /* council */) external {
             directDelegate(_getExecutorAdmin());

455:     function updatePositionC7F1F740(
             address /* pool */,
             uint256 /* id */,
             int128 /* delta */
         ) external returns (int256, int256) {
             directDelegate(_getExecutorUpdatePosition());

455:     function updatePositionC7F1F740(
             address /* pool */,
             uint256 /* id */,
             int128 /* delta */
         ) external returns (int256, int256) {
             directDelegate(_getExecutorUpdatePosition());

549:     function _setProxyAdmin(address newAdmin) internal {
             StorageSlot.getAddressSlot(PROXY_ADMIN_SLOT).value = newAdmin;

549:     function _setProxyAdmin(address newAdmin) internal {
             StorageSlot.getAddressSlot(PROXY_ADMIN_SLOT).value = newAdmin;

553:     function _setProxies(
             ISeawaterExecutorSwap executorSwap,
             ISeawaterExecutorSwapPermit2 executorSwapPermit2,
             ISeawaterExecutorQuote executorQuote,
             ISeawaterExecutorPosition executorPosition,
             ISeawaterExecutorUpdatePosition executorUpdatePosition,
             ISeawaterExecutorAdmin executorAdmin,
             ISeawaterExecutorFallback executorFallback
         ) internal {
             StorageSlot.getAddressSlot(EXECUTOR_SWAP_SLOT).value = address(executorSwap);
             StorageSlot.getAddressSlot(EXECUTOR_SWAP_PERMIT2_SLOT).value = address(executorSwapPermit2);
             StorageSlot.getAddressSlot(EXECUTOR_QUOTE_SLOT).value = address(executorQuote);
             StorageSlot.getAddressSlot(EXECUTOR_POSITION_SLOT).value = address(executorPosition);
             StorageSlot.getAddressSlot(EXECUTOR_UPDATE_POSITION_SLOT).value = address(executorUpdatePosition);
             StorageSlot.getAddressSlot(EXECUTOR_ADMIN_SLOT).value = address(executorAdmin);
             StorageSlot.getAddressSlot(EXECUTOR_FALLBACK_SLOT).value = address(executorFallback);

553:     function _setProxies(
             ISeawaterExecutorSwap executorSwap,
             ISeawaterExecutorSwapPermit2 executorSwapPermit2,
             ISeawaterExecutorQuote executorQuote,
             ISeawaterExecutorPosition executorPosition,
             ISeawaterExecutorUpdatePosition executorUpdatePosition,
             ISeawaterExecutorAdmin executorAdmin,
             ISeawaterExecutorFallback executorFallback
         ) internal {
             StorageSlot.getAddressSlot(EXECUTOR_SWAP_SLOT).value = address(executorSwap);
             StorageSlot.getAddressSlot(EXECUTOR_SWAP_PERMIT2_SLOT).value = address(executorSwapPermit2);
             StorageSlot.getAddressSlot(EXECUTOR_QUOTE_SLOT).value = address(executorQuote);
             StorageSlot.getAddressSlot(EXECUTOR_POSITION_SLOT).value = address(executorPosition);
             StorageSlot.getAddressSlot(EXECUTOR_UPDATE_POSITION_SLOT).value = address(executorUpdatePosition);
             StorageSlot.getAddressSlot(EXECUTOR_ADMIN_SLOT).value = address(executorAdmin);
             StorageSlot.getAddressSlot(EXECUTOR_FALLBACK_SLOT).value = address(executorFallback);

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-10"></a>[NC-10] Lines are too long
Usually lines in source code are limited to [80](https://softwareengineering.stackexchange.com/questions/148677/why-is-80-characters-the-standard-limit-for-code-width) characters. Today's screens are much larger so it's reasonable to stretch this in some cases. Since the files will most likely reside in GitHub, and GitHub starts using a scroll bar in all cases when the length is over [164](https://github.com/aizatto/character-length) characters, the lines below should be split when they reach that length

*Instances (3)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

244:     function swap2ExactIn41203F1D(address /* tokenA */, address /* tokenB */, uint256 /* amountIn */, uint256 /* minAmountOut */) external returns (uint256, uint256) {

281:     function swapInPermit2CEAAB576(address token, uint256 amountIn, uint256 minOut, uint256 nonce, uint256 deadline, uint256 maxAmount, bytes memory sig) external returns (int256, int256) {

322:     function swapOutPermit23273373B(address token, uint256 amountIn, uint256 minOut, uint256 nonce, uint256 deadline, uint256 maxAmount, bytes memory sig) external returns (int256, int256) {

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-11"></a>[NC-11] Missing Event for critical parameters change
Events help non-contract tools to track changes, and events prevent users from being surprised by changes.

*Instances (13)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

166:     function setApprovalForAll(address _operator, bool _approved) external {
             isApprovedForAll[msg.sender][_operator] = _approved;

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

```solidity
File: ./pkg/sol/SeawaterAMM.sol

104:     function updateProxyAdmin(address newAdmin) public onlyProxyAdmin {
             _setProxyAdmin(newAdmin);

104:     function updateProxyAdmin(address newAdmin) public onlyProxyAdmin {
             _setProxyAdmin(newAdmin);

115:     function updateExecutors(
             ISeawaterExecutorSwap executorSwap,
             ISeawaterExecutorSwapPermit2 executorSwapPermit2,
             ISeawaterExecutorQuote executorQuote,
             ISeawaterExecutorPosition executorPosition,
             ISeawaterExecutorUpdatePosition executorUpdatePosition,
             ISeawaterExecutorAdmin executorAdmin,
             ISeawaterExecutorFallback executorFallback
         ) public onlyProxyAdmin {
             _setProxies(executorSwap, executorSwapPermit2, executorQuote, executorPosition, executorUpdatePosition, executorAdmin, executorFallback);

115:     function updateExecutors(
             ISeawaterExecutorSwap executorSwap,
             ISeawaterExecutorSwapPermit2 executorSwapPermit2,
             ISeawaterExecutorQuote executorQuote,
             ISeawaterExecutorPosition executorPosition,
             ISeawaterExecutorUpdatePosition executorUpdatePosition,
             ISeawaterExecutorAdmin executorAdmin,
             ISeawaterExecutorFallback executorFallback
         ) public onlyProxyAdmin {
             _setProxies(executorSwap, executorSwapPermit2, executorQuote, executorPosition, executorUpdatePosition, executorAdmin, executorFallback);

197:     function setSqrtPriceFF4DB98C(address /* pool */, uint256 /* price */) external {
             directDelegate(_getExecutorAdmin());

197:     function setSqrtPriceFF4DB98C(address /* pool */, uint256 /* price */) external {
             directDelegate(_getExecutorAdmin());

202:     function updateNftManager9BDF41F6(address /* manager */) external {
             directDelegate(_getExecutorAdmin());

202:     function updateNftManager9BDF41F6(address /* manager */) external {
             directDelegate(_getExecutorAdmin());

207:     function updateEmergencyCouncil7D0C1C58(address /* council */) external {
             directDelegate(_getExecutorAdmin());

207:     function updateEmergencyCouncil7D0C1C58(address /* council */) external {
             directDelegate(_getExecutorAdmin());

455:     function updatePositionC7F1F740(
             address /* pool */,
             uint256 /* id */,
             int128 /* delta */
         ) external returns (int256, int256) {
             directDelegate(_getExecutorUpdatePosition());

455:     function updatePositionC7F1F740(
             address /* pool */,
             uint256 /* id */,
             int128 /* delta */
         ) external returns (int256, int256) {
             directDelegate(_getExecutorUpdatePosition());

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-12"></a>[NC-12] NatSpec is completely non-existent on functions that should have them
Public and external functions that aren't view or pure should have NatSpec comments

*Instances (1)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

118:     function transferFrom(

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

### <a name="NC-13"></a>[NC-13] Incomplete NatSpec: `@param` is missing on actually documented functions
The following functions are missing `@param` NatSpec comments.

*Instances (1)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

108:     /// @notice updates the addresses of the executors. only usable by the proxy admin
         /// @param executorSwap the address of the swap executor
         /// @param executorSwapPermit2 the deployed code for the swap_permit2 executor
         /// @param executorQuote the deployed code for the quote executor
         /// @param executorPosition the address of the position executor
         /// @param executorAdmin the address of the admin executor
         /// @param executorFallback the address of the fallback executor
         function updateExecutors(
             ISeawaterExecutorSwap executorSwap,
             ISeawaterExecutorSwapPermit2 executorSwapPermit2,
             ISeawaterExecutorQuote executorQuote,
             ISeawaterExecutorPosition executorPosition,
             ISeawaterExecutorUpdatePosition executorUpdatePosition,
             ISeawaterExecutorAdmin executorAdmin,
             ISeawaterExecutorFallback executorFallback

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-14"></a>[NC-14] Use a `modifier` instead of a `require/if` statement for a special `msg.sender` actor
If a function is supposed to be access-controlled, a `modifier` should be used instead of a `require/if` statement for more readability.

*Instances (1)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

161:         _requireAuthorised(msg.sender, _tokenId);

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

### <a name="NC-15"></a>[NC-15] Consider using named mappings
Consider moving to solidity version 0.8.18 or later, and using [named mappings](https://ethereum.stackexchange.com/questions/51629/how-to-name-the-arguments-in-mapping/145555#145555) to make it easier to understand the purpose of each mapping

*Instances (2)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

33:     mapping(uint256 => address) public getApproved;

36:     mapping(address => mapping(address => bool)) public isApprovedForAll;

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

### <a name="NC-16"></a>[NC-16] `require()` / `revert()` statements should have descriptive reason strings

*Instances (2)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

506:         require(msg.data.length > 3);

507:         require(msg.data[0] == 0);

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-17"></a>[NC-17] Take advantage of Custom Error's return value property
An important feature of Custom Error is that values such as address, tokenID, msg.value can be written inside the () sign, this kind of approach provides a serious advantage in debugging and examining the revert details of dapps such as tenderly.

*Instances (1)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

149:                 revert(0, returndatasize())

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-18"></a>[NC-18] Contract does not follow the Solidity style guide's suggested layout ordering
The [style guide](https://docs.soliditylang.org/en/v0.8.16/style-guide.html#order-of-layout) says that, within a contract, the ordering should be:

1) Type declarations
2) State variables
3) Events
4) Modifiers
5) Functions

However, the contract(s) below do not follow this ordering

*Instances (1)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

1: 
   Current order:
   StructDefinition.AddressSlot
   FunctionDefinition.getAddressSlot
   ModifierDefinition.onlyProxyAdmin
   FunctionDefinition.constructor
   FunctionDefinition.updateProxyAdmin
   FunctionDefinition.updateExecutors
   FunctionDefinition.directDelegate
   FunctionDefinition.createPoolD650E2D0
   FunctionDefinition.collectProtocol7540FA9F
   FunctionDefinition.enablePool579DA658
   FunctionDefinition.authoriseEnabler5B17C274
   FunctionDefinition.setSqrtPriceFF4DB98C
   FunctionDefinition.updateNftManager9BDF41F6
   FunctionDefinition.updateEmergencyCouncil7D0C1C58
   FunctionDefinition.swap904369BE
   FunctionDefinition.quote72E2ADE7
   FunctionDefinition.quote2CD06B86E
   FunctionDefinition.swapPermit2EE84AD91
   FunctionDefinition.swap2ExactIn41203F1D
   FunctionDefinition.swap2ExactInPermit236B2FDD8
   FunctionDefinition.swapIn32502CA71
   FunctionDefinition.swapInPermit2CEAAB576
   FunctionDefinition.swapOut5E08A399
   FunctionDefinition.swapOutPermit23273373B
   FunctionDefinition.mintPositionBC5B086D
   FunctionDefinition.burnPositionAE401070
   FunctionDefinition.positionOwnerD7878480
   FunctionDefinition.transferPositionEEC7A3CD
   FunctionDefinition.positionBalance4F32C7DB
   FunctionDefinition.positionLiquidity8D11C045
   FunctionDefinition.positionTickLower2F77CCE1
   FunctionDefinition.positionTickUpper67FD55BA
   FunctionDefinition.sqrtPriceX967B8F5FC5
   FunctionDefinition.feesOwed22F28DBD
   FunctionDefinition.curTick181C6FD9
   FunctionDefinition.tickSpacing653FE28F
   FunctionDefinition.feeBB3CF608
   FunctionDefinition.feeGrowthGlobal038B5665B
   FunctionDefinition.feeGrowthGlobal1A33A5A1B
   FunctionDefinition.collectSingleTo6D76575F
   FunctionDefinition.collect7F21947C
   FunctionDefinition.updatePositionC7F1F740
   FunctionDefinition.incrPositionC3AC7CAA
   FunctionDefinition.decrPosition09293696
   FunctionDefinition.incrPositionPermit25468326E
   FunctionDefinition.fallback
   FunctionDefinition._getExecutorSwap
   FunctionDefinition._getExecutorSwapPermit2
   FunctionDefinition._getExecutorQuote
   FunctionDefinition._getExecutorPosition
   FunctionDefinition._getExecutorUpdatePosition
   FunctionDefinition._getExecutorAdmin
   FunctionDefinition._getExecutorFallback
   FunctionDefinition._setProxyAdmin
   FunctionDefinition._setProxies
   
   Suggested order:
   StructDefinition.AddressSlot
   ModifierDefinition.onlyProxyAdmin
   FunctionDefinition.getAddressSlot
   FunctionDefinition.constructor
   FunctionDefinition.updateProxyAdmin
   FunctionDefinition.updateExecutors
   FunctionDefinition.directDelegate
   FunctionDefinition.createPoolD650E2D0
   FunctionDefinition.collectProtocol7540FA9F
   FunctionDefinition.enablePool579DA658
   FunctionDefinition.authoriseEnabler5B17C274
   FunctionDefinition.setSqrtPriceFF4DB98C
   FunctionDefinition.updateNftManager9BDF41F6
   FunctionDefinition.updateEmergencyCouncil7D0C1C58
   FunctionDefinition.swap904369BE
   FunctionDefinition.quote72E2ADE7
   FunctionDefinition.quote2CD06B86E
   FunctionDefinition.swapPermit2EE84AD91
   FunctionDefinition.swap2ExactIn41203F1D
   FunctionDefinition.swap2ExactInPermit236B2FDD8
   FunctionDefinition.swapIn32502CA71
   FunctionDefinition.swapInPermit2CEAAB576
   FunctionDefinition.swapOut5E08A399
   FunctionDefinition.swapOutPermit23273373B
   FunctionDefinition.mintPositionBC5B086D
   FunctionDefinition.burnPositionAE401070
   FunctionDefinition.positionOwnerD7878480
   FunctionDefinition.transferPositionEEC7A3CD
   FunctionDefinition.positionBalance4F32C7DB
   FunctionDefinition.positionLiquidity8D11C045
   FunctionDefinition.positionTickLower2F77CCE1
   FunctionDefinition.positionTickUpper67FD55BA
   FunctionDefinition.sqrtPriceX967B8F5FC5
   FunctionDefinition.feesOwed22F28DBD
   FunctionDefinition.curTick181C6FD9
   FunctionDefinition.tickSpacing653FE28F
   FunctionDefinition.feeBB3CF608
   FunctionDefinition.feeGrowthGlobal038B5665B
   FunctionDefinition.feeGrowthGlobal1A33A5A1B
   FunctionDefinition.collectSingleTo6D76575F
   FunctionDefinition.collect7F21947C
   FunctionDefinition.updatePositionC7F1F740
   FunctionDefinition.incrPositionC3AC7CAA
   FunctionDefinition.decrPosition09293696
   FunctionDefinition.incrPositionPermit25468326E
   FunctionDefinition.fallback
   FunctionDefinition._getExecutorSwap
   FunctionDefinition._getExecutorSwapPermit2
   FunctionDefinition._getExecutorQuote
   FunctionDefinition._getExecutorPosition
   FunctionDefinition._getExecutorUpdatePosition
   FunctionDefinition._getExecutorAdmin
   FunctionDefinition._getExecutorFallback
   FunctionDefinition._setProxyAdmin
   FunctionDefinition._setProxies

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-19"></a>[NC-19] Internal and private variables and functions names should begin with an underscore
According to the Solidity Style Guide, Non-`external` variable and function names should begin with an [underscore](https://docs.soliditylang.org/en/latest/style-guide.html#underscore-prefix-for-non-external-functions-and-variables)

*Instances (2)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

42:     function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {

132:     function directDelegate(address to) internal {

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="NC-20"></a>[NC-20] `public` functions not called by the contract should be declared `external` instead

*Instances (2)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

104:     function updateProxyAdmin(address newAdmin) public onlyProxyAdmin {

115:     function updateExecutors(

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)


## Low Issues


| |Issue|Instances|
|-|:-|:-:|
| [L-1](#L-1) | Fallback lacking `payable` | 11 |
| [L-2](#L-2) | NFT ownership doesn't support hard forks | 1 |
| [L-3](#L-3) | Solidity version 0.8.20+ may not work on other chains due to `PUSH0` | 2 |
### <a name="L-1"></a>[L-1] Fallback lacking `payable`

*Instances (11)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

30: bytes32 constant EXECUTOR_FALLBACK_SLOT = bytes32(uint256(keccak256("seawater.impl.fallback")) - 1);

79:         ISeawaterExecutorFallback _executorFallback

89:             _executorFallback

122:         ISeawaterExecutorFallback executorFallback

124:         _setProxies(executorSwap, executorSwapPermit2, executorQuote, executorPosition, executorUpdatePosition, executorAdmin, executorFallback);

505:     fallback() external {

520:         else directDelegate(_getExecutorFallback());

545:     function _getExecutorFallback() internal view returns (address) {

546:         return StorageSlot.getAddressSlot(EXECUTOR_FALLBACK_SLOT).value;

560:         ISeawaterExecutorFallback executorFallback

568:         StorageSlot.getAddressSlot(EXECUTOR_FALLBACK_SLOT).value = address(executorFallback);

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="L-2"></a>[L-2] NFT ownership doesn't support hard forks
To ensure clarity regarding the ownership of the NFT on a specific chain, it is recommended to add `require(block.chainid == 1, "Invalid Chain")` or the desired chain ID in the functions below.

Alternatively, consider including the chain ID in the URI itself. By doing so, any confusion regarding the chain responsible for owning the NFT will be eliminated.

*Instances (1)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

182:     function tokenURI(uint256 /* _tokenId */) external view returns (string memory) {
             return TOKEN_URI;

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

### <a name="L-3"></a>[L-3] Solidity version 0.8.20+ may not work on other chains due to `PUSH0`
The compiler for Solidity 0.8.20 switches the default target EVM version to [Shanghai](https://blog.soliditylang.org/2023/05/10/solidity-0.8.20-release-announcement/#important-note), which includes the new `PUSH0` op code. This op code may not yet be implemented on all L2s, so deployment on these chains will fail. To work around this issue, use an earlier [EVM](https://docs.soliditylang.org/en/v0.8.20/using-the-compiler.html?ref=zaryabs.com#setting-the-evm-version-to-target) [version](https://book.getfoundry.sh/reference/config/solidity-compiler#evm_version). While the project itself may or may not compile with 0.8.20, other projects with which it integrates, or which extend this project may, and those projects will have problems deploying these contracts/libraries.

*Instances (2)*:
```solidity
File: ./pkg/sol/OwnershipNFTs.sol

2: pragma solidity 0.8.16;

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/OwnershipNFTs.sol)

```solidity
File: ./pkg/sol/SeawaterAMM.sol

2: pragma solidity 0.8.16;

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)


## Medium Issues


| |Issue|Instances|
|-|:-|:-:|
| [M-1](#M-1) | Fees can be set to be greater than 100%. | 8 |
| [M-2](#M-2) | Library function isn't `internal` or `private` | 41 |
### <a name="M-1"></a>[M-1] Fees can be set to be greater than 100%.
There should be an upper limit to reasonable fees.
A malicious owner can keep the fee rate at zero, but if a large value transfer enters the mempool, the owner can jack the rate up to the maximum and sandwich attack a user.

*Instances (8)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

405:     function feesOwed22F28DBD(
             address /* pool */,
             uint256 /* position */
         ) external returns (uint128, uint128) {
             directDelegate(_getExecutorAdmin());

405:     function feesOwed22F28DBD(
             address /* pool */,
             uint256 /* position */
         ) external returns (uint128, uint128) {
             directDelegate(_getExecutorAdmin());

423:     function feeBB3CF608(address /* pool */) external returns (uint32) {
             directDelegate(_getExecutorAdmin());

423:     function feeBB3CF608(address /* pool */) external returns (uint32) {
             directDelegate(_getExecutorAdmin());

428:     function feeGrowthGlobal038B5665B(address /* pool */) external returns (uint256) {
             directDelegate(_getExecutorAdmin());

428:     function feeGrowthGlobal038B5665B(address /* pool */) external returns (uint256) {
             directDelegate(_getExecutorAdmin());

433:     function feeGrowthGlobal1A33A5A1B(address /*pool */) external returns (uint256) {
             directDelegate(_getExecutorAdmin());

433:     function feeGrowthGlobal1A33A5A1B(address /*pool */) external returns (uint256) {
             directDelegate(_getExecutorAdmin());

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

### <a name="M-2"></a>[M-2] Library function isn't `internal` or `private`
In a library, using an external or public visibility means that we won't be going through the library with a DELEGATECALL but with a CALL. This changes the context and should be done carefully.

*Instances (41)*:
```solidity
File: ./pkg/sol/SeawaterAMM.sol

104:     function updateProxyAdmin(address newAdmin) public onlyProxyAdmin {

115:     function updateExecutors(

160:     function createPoolD650E2D0(

171:     function collectProtocol7540FA9F(

181:     function enablePool579DA658(

189:     function authoriseEnabler5B17C274(

197:     function setSqrtPriceFF4DB98C(address /* pool */, uint256 /* price */) external {

202:     function updateNftManager9BDF41F6(address /* manager */) external {

207:     function updateEmergencyCouncil7D0C1C58(address /* council */) external {

214:     function swap904369BE(address /* pool */, bool /* zeroForOne */, int256 /* amount */, uint256 /* priceLimit */) external returns (int256, int256) {

219:     function quote72E2ADE7(address /* pool */, bool /* zeroForOne */, int256 /* amount */, uint256 /* priceLimit */) external {

225:     function quote2CD06B86E(address /* to */, address /* from */, uint256 /* amount */, uint256 /* minOut*/) external {

230:     function swapPermit2EE84AD91(

244:     function swap2ExactIn41203F1D(address /* tokenA */, address /* tokenB */, uint256 /* amountIn */, uint256 /* minAmountOut */) external returns (uint256, uint256) {

249:     function swap2ExactInPermit236B2FDD8(

262:     function swapIn32502CA71(address token, uint256 amountIn, uint256 minOut) external returns (int256, int256) {

281:     function swapInPermit2CEAAB576(address token, uint256 amountIn, uint256 minOut, uint256 nonce, uint256 deadline, uint256 maxAmount, bytes memory sig) external returns (int256, int256) {

304:     function swapOut5E08A399(address token, uint256 amountIn, uint256 minOut) external returns (int256, int256) {

322:     function swapOutPermit23273373B(address token, uint256 amountIn, uint256 minOut, uint256 nonce, uint256 deadline, uint256 maxAmount, bytes memory sig) external returns (int256, int256) {

346:     function mintPositionBC5B086D(address /* token */, int32 /* lower */, int32 /* upper */) external returns (uint256 /* id */) {

351:     function burnPositionAE401070(uint256 /* id */) external {

356:     function positionOwnerD7878480(uint256 /* id */) external returns (address) {

362:     function transferPositionEEC7A3CD(

371:     function positionBalance4F32C7DB(address /* user */) external returns (uint256) {

376:     function positionLiquidity8D11C045(

384:     function positionTickLower2F77CCE1(

392:     function positionTickUpper67FD55BA(

400:     function sqrtPriceX967B8F5FC5(address /* pool */) external returns (uint256) {

405:     function feesOwed22F28DBD(

413:     function curTick181C6FD9(address /* pool */) external returns (int32) {

418:     function tickSpacing653FE28F(address /* pool */) external returns (uint8) {

423:     function feeBB3CF608(address /* pool */) external returns (uint32) {

428:     function feeGrowthGlobal038B5665B(address /* pool */) external returns (uint256) {

433:     function feeGrowthGlobal1A33A5A1B(address /*pool */) external returns (uint256) {

438:     function collectSingleTo6D76575F(

447:     function collect7F21947C(

455:     function updatePositionC7F1F740(

464:     function incrPositionC3AC7CAA(

476:     function decrPosition09293696(

487:     function incrPositionPermit25468326E(

505:     fallback() external {

```
[Link to code](https://github.com/code-423n4/2024-08-superposition/tree/main/./pkg/sol/SeawaterAMM.sol)

