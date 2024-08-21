import {Contract, ContractFactory, JsonRpcProvider, Log, MaxUint256, Provider, TypedDataDomain, Wallet, id } from "ethers";
import LightweightERC20 from "../out/LightweightERC20.sol/LightweightERC20.json"
import Permit2 from "../out/permit2.sol/Permit2.json"
import {abi as SeawaterABI}  from "../out/SeawaterAMM.sol/SeawaterAMM.json"
import test from "node:test"
import assert from "node:assert"
import {execSync} from "node:child_process";

import { SignatureTransfer } from "@uniswap/permit2-sdk";

// stylus testnode wallet
const DEFAULT_WALLET = "0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659";

function encodeSqrtPrice(price: number): BigInt {
    return BigInt(Math.sqrt(price) * 2**96);
}

function sixDecimals(amount: number): BigInt {
    return BigInt(amount) * BigInt(1_000_000);
}

function encodeTick(price: number): number {
    // log_1.0001(num/denom)
    return Math.floor(Math.log(price) / Math.log(1.0001));
}

async function encodeDeadline(signer: Provider, seconds: number) {
    const bn = await signer.getBlockNumber();
    const timestamp = (await signer.getBlock(bn))!.timestamp;
    return timestamp + seconds;
}

async function deployToken(factory: ContractFactory, name: string, sym: string, decimals: number, amount: BigInt, account: string) {
    const contract = await factory.deploy(name, sym, decimals, amount, account);
    const address = await contract.getAddress();
    await contract.waitForDeployment();
    return address;
}

async function deployPermit2(factory: ContractFactory) {
    const contract = await factory.deploy();
    const address = await contract.getAddress();
    await contract.waitForDeployment();
    return address;
}

async function setApprovalTo(tokens: Contract[], to: string, amount: BigInt) {
    for (const token of tokens) {
        await (await token.approve(to, amount)).wait()
    }
}

// mints a position and updates it with liquidity
async function createPosition(
    amm: Contract,
    address: string,
    lower: number,
    upper: number,
    delta: BigInt,
) {
    const mintResult = await amm.mintPositionBC5B086D(address, lower, upper);

    console.log(`mint position tx: ${mintResult.hash}`);

    const [mintLog]: [mintLog: Log] = await mintResult.wait()
    type mintEventArgs = [
        BigInt,
        string,
        string,
        BigInt,
        BigInt,
    ]

    // has an issue with readonly typing
    // @ts-ignore
    const {args}  = amm.interface.parseLog(mintLog) || {}
    const [id, /*user*/, /*pool*/, /*low*/, /*high*/] = args as unknown as mintEventArgs;

    const updatePositionResult = await amm.updatePositionC7F1F740(address, id, delta)
    await updatePositionResult.wait()

    return id;
}

test("amm", async t => {
    // setup and deploy contracts
    const RPC_URL = process.env.SPN_GETH_URL
    if (!RPC_URL) throw new Error("Set SPN_GETH_URL");
    const provider = new JsonRpcProvider(RPC_URL)
    const chainid = Number((await provider.getNetwork()).chainId);
    console.log(`chainid: ${chainid}`);
    const signer = new Wallet(DEFAULT_WALLET, provider)
    const defaultAccount = await signer.getAddress();

    const permit2Factory = new ContractFactory(Permit2.abi, Permit2.bytecode, signer);
    const permit2Address = await deployPermit2(permit2Factory);
    console.log("permit2",permit2Address)

    const erc20Factory = new ContractFactory(LightweightERC20.abi, LightweightERC20.bytecode, signer)

    const fusdcAddress = await deployToken(erc20Factory, "Fluid USDC", "FUSDC", 6, sixDecimals(1_000_000), defaultAccount);
    console.log("fusdc",fusdcAddress)

    const tusdcAddress = await deployToken(erc20Factory, "Test USDC", "TUSDC", 6, sixDecimals(1_000_000), defaultAccount);
    console.log("tusdc",tusdcAddress)

    const tusdc2Address = await deployToken(erc20Factory, "Test USDC 2.0", "TUSDC2", 6, sixDecimals(1_000_000), defaultAccount);
    console.log("tusdc2",tusdc2Address)

    console.log("done deploying all the tokens");

    execSync(
      "make -B solidity seawater",
      { env: {
          ...process.env,
          "FLU_SEAWATER_FUSDC_ADDR": fusdcAddress,
          "FLU_SEAWATER_PERMIT2_ADDR": permit2Address,
      } }
    );

    // assuming this went correctly!
    const {
      seawater_proxy: ammAddress,
      seawater_positions_impl: seawaterPositionsImplAddr
    } = JSON.parse(execSync(
        "./deploy.sh",
        { env: {
            ...process.env,
            "SEAWATER_PROXY_ADMIN": defaultAccount,
            "FLU_SEAWATER_FUSDC_ADDR": fusdcAddress,
            "SEAWATER_EMERGENCY_COUNCIL": "0x0000000000000000000000000000000000000000",
            "STYLUS_ENDPOINT": RPC_URL,
            "STYLUS_PRIVATE_KEY": DEFAULT_WALLET,
            "FLU_SEAWATER_PERMIT2_ADDR": permit2Address,
            "NFT_MANAGER_ADDR": defaultAccount,
        } },
    )
      .toString()
    );

    console.log("seawater positions impl", seawaterPositionsImplAddr);
    console.log("amm address", ammAddress);

    const amm = new Contract(ammAddress, SeawaterABI, signer);

    const fusdcContract = new Contract(fusdcAddress, LightweightERC20.abi, signer)
    const tusdcContract = new Contract(tusdcAddress, LightweightERC20.abi, signer)
    const tusdc2Contract = new Contract(tusdc2Address, LightweightERC20.abi, signer)

    console.log("seawater proxy admin", ammAddress);

    // address token,
    // uint256 sqrtPriceX96,
    // uint32 fee,
    // uint8 tickSpacing,
    // uint128 maxLiquidityPerTick
    await (await amm.createPoolD650E2D0(tusdcAddress, encodeSqrtPrice(100), 500, 10, 100000000000)).wait();

    await (await amm.enablePool579DA658(tusdcAddress, true)).wait();
    await (await amm.createPoolD650E2D0(tusdc2Address, encodeSqrtPrice(100), 500, 10, 100000000000)).wait();
    await (await amm.enablePool579DA658(tusdc2Address, true)).wait();

    // approve amm and permit2 for both contracts
    // initialise an empty position
    // update the position with liquidity
    // then make a swap
    await setApprovalTo([fusdcContract, tusdcContract, tusdc2Contract], permit2Address, MaxUint256);

    console.log("balance of the tusdc signer", await tusdcContract.balanceOf(signer.address));

    const lowerTick = 39120;
    const upperTick = 50100;
    const liquidityDelta = BigInt(20000);

    console.log("lowerTick", lowerTick);
    console.log("upperTick", upperTick);

    await setApprovalTo([fusdcContract, tusdcContract, tusdc2Contract], ammAddress, MaxUint256);

    const tusdcPositionId = await createPosition(amm, tusdcAddress, lowerTick, upperTick, liquidityDelta);
    const tusdc2PositionId = await createPosition(amm, tusdc2Address, lowerTick, upperTick, liquidityDelta);

    let curNonce = await signer.getNonce() + 1;
})
