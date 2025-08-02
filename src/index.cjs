const dotenv = require("dotenv");
dotenv.config();

const Sdk = require("@1inch/cross-chain-sdk");
const { parseUnits } = require("ethers");
const { JsonRpcProvider } = require("ethers");
const { TronWeb } = require("tronweb");
const { createOrder } = require("./order.cjs");
const { Address } = Sdk;
const { config } = require("../config/tron.js");
const { TronResolver } = require("./contracts/tron-resolver.cjs");
const {TronEscrowFactory} = require("./contracts/tron-escrow-factory.js");
const { EvmResolver } = require("./contracts/evm-resolver.cjs");
const {EvmEscrowFactory} = require("./contracts/evm-escrow-factory.js");
const { EVMWallet } = require("./wallet/evm.js");
const { TronIndexer } = require("./indexer/tron.js");



// Use Nile testnet
const tronWeb = new TronWeb({
    fullHost: config.src.RpcUrl,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: config.src.ResolverPrivateKey,
  });


// Create resolver instance for both chains
const tronResolver = new TronResolver(
  config.src.ResolverContractAddress,
  config.src.LOP,
  tronWeb
);
const evmResolver = new EvmResolver(
  config.src.ResolverContractAddress,
  config.dst.ResolverContractAddress
)

// Create TronIndexer instance
const tronIndexer = new TronIndexer(process.env.TRONGRID_API_KEY, 'nile');

// Create EVM wallets for user and resolver
const EvmUserWallet = new EVMWallet(
  config.src.UserPrivateKey,
  new JsonRpcProvider(config.dst.RpcUrl)
);

const EvmResolverWallet = new EVMWallet(
  config.dst.ResolverPrivateKey,
  new JsonRpcProvider(config.dst.RpcUrl)
);

// Create escrow factory instances for both chains
const srcEscrowFactory = new TronEscrowFactory(
  config.src.EscrowFactory,
  tronWeb
);

const dstEscrowFactory = new EvmEscrowFactory(
  new JsonRpcProvider(config.dst.RpcUrl),
  config.dst.EscrowFactory,
);

async function main() {
    await srcEscrowFactory.init();

    // get User(maker) address
    const srcChainUserAddress = tronWeb.address.fromPrivateKey(config.src.UserPrivateKey);

    // create order with fresh timestamp and salt
    console.log("Creating new order with fresh parameters...");
    const makingAmount = parseUnits("1.432", 6);
    const takingAmount = parseUnits("1.234", 10);
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
  const signature = await EvmUserWallet.signOrder(config.src.ChainId, order, config.src.LOP);

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

  console.log("Creating dst escrow immutables");
  const dstImmutables = immutables
    .withComplement(complement)
    .withTaker(new Address(config.dst.ResolverContractAddress));

  console.log("Deploying dst escrow...");
  const { txHash: dstDepositHash, blockTimestamp: dstDeployedAt } =
    await EvmResolverWallet.send(evmResolver.deployDst(dstImmutables));
  console.log("Dst escrow deployed", dstDepositHash);


  console.log("Getting escrow addresses...");
  const ESCROW_SRC_IMPLEMENTATION = await srcEscrowFactory.getSourceImpl();
  const ESCROW_DST_IMPLEMENTATION = await dstEscrowFactory.getDestinationImpl();
  const srcEscrowAddress = new Sdk.EscrowFactory(
    new Address(config.src.EscrowFactory)
  ).getSrcEscrowAddress(immutables, ESCROW_SRC_IMPLEMENTATION);

  const dstEscrowAddress = new Sdk.EscrowFactory(
    new Address(config.dst.EscrowFactory)
  ).getDstEscrowAddress(
    immutables,
    complement,
    dstDeployedAt,
    new Address(config.dst.ResolverContractAddress),
    ESCROW_DST_IMPLEMENTATION
  );
  console.log("Escrow addresses fetched");

  console.log("Src escrow address", srcEscrowAddress);
  console.log("Dst escrow address", dstEscrowAddress);

  console.log("Withdrawing from dst escrow for user in 20secs...");
  await new Promise((resolve) => setTimeout(resolve, 20000));
  const { txHash: dstWithdrawHash } = await EvmResolverWallet.send(
    evmResolver.withdraw(
      "dst",
      dstEscrowAddress,
      secret,
      dstImmutables.withDeployedAt(dstDeployedAt)
    )
  );
  console.log("Dst escrow withdrawn", dstWithdrawHash);

  console.log("Withdrawing from src escrow for resolver...");
  // For TRON chain, we need to use the TRON resolver directly
  const { txHash: resolverWithdrawHash } = await tronResolver.withdraw(
    "src",
    srcEscrowAddress,
    secret,
    immutables
  );
  console.log("Src escrow withdrawn", resolverWithdrawHash);
}

main();
