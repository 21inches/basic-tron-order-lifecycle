const dotenv = require("dotenv");
dotenv.config();

const Sdk = require("@1inch/cross-chain-sdk");
const { parseUnits } = require("ethers");
const { JsonRpcProvider } = require("ethers");
const { TronWeb } = require("tronweb");
const { createOrder } = require("./order.cjs");
const { Address } = Sdk;

//configs
const { config } = require("../config/tron.js");
// contracts
const { TronResolver } = require("./contracts/tron-resolver.cjs");

// wallets
const { EVMWallet } = require("./wallet/evm.js");

// Indexer
const { TronIndexer } = require("./indexer/tron.js");

// Use Nile testnet
const tronWeb = new TronWeb({
    fullHost: config.src.RpcUrl,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: config.src.ResolverPrivateKey,
  });

const tronResolver = new TronResolver(
  config.src.ResolverContractAddress,
  config.src.LOP,
  tronWeb
);

const tronIndexer = new TronIndexer(process.env.TRONGRID_API_KEY, 'nile');

const EvmChainUser = new EVMWallet(
  config.src.UserPrivateKey,
  new JsonRpcProvider(config.dst.RpcUrl)
);

async function main() {
    // get User(maker) address
    const srcChainUserAddress = tronWeb.address.fromPrivateKey(config.src.UserPrivateKey);

    // create order with fresh timestamp and salt
    console.log("Creating new order with fresh parameters...");
    const makingAmount = parseUnits("3", 6);
    const takingAmount = parseUnits("3", 6);
    const secret = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const srcTimestamp = BigInt(Math.floor(Date.now() / 1000));

    // Create a new order with fresh parameters
    const order = await createOrder(
      config.src.EscrowFactory,
      srcChainUserAddress,
      makingAmount,
      takingAmount,
      config.src.USDT,
      config.dst.BLT,
      secret,
      config.src.ChainId,
      config.dst.ChainId,
      config.src.ResolverContractAddress,
      srcTimestamp
  );
  console.log("New order created with salt:", order.salt.toString());
  console.log("Order details:", order.build());

  // sign order by user
  const signature = await EvmChainUser.signOrder(config.src.ChainId, order, config.src.LOP);

  // fill order
  console.log("Filling order...");
  const { txHash: orderFillHash, blockHash: srcDeployBlock } =
    await tronResolver.deploySrcOnTron(
      config.src.ChainId,
      order,
      signature,
      Sdk.TakerTraits.default()
        .setExtension(order.extension)
        .setAmountMode(Sdk.AmountMode.maker)
        .setAmountThreshold(order.takingAmount),
      order.makingAmount
  )
  console.log("Order filled", orderFillHash);


  console.log("Fetching src escrow event...");
  const [immutables, complement] = await tronIndexer.waitForSrcEscrowCreatedEvent(orderFillHash);
  const dstImmutables = immutables
    .withComplement(complement)
    .withTaker(new Address(tronResolver.dstResolverAddress));
  console.log("Src escrow event fetched");

  console.log("Deploying dst escrow...");
  const { txHash: dstDepositHash, blockTimestamp: dstDeployedAt } =
    await dstChainResolver.send(resolverContract.deployDst(dstImmutables));
  console.log("Dst escrow deployed", dstDepositHash);
}

main();
