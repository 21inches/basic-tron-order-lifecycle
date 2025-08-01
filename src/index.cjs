const dotenv = require("dotenv");
dotenv.config();

const Sdk = require("@1inch/cross-chain-sdk");
const { parseEther, parseUnits, TypedDataEncoder } = require("ethers");
const { UINT_40_MAX } = require("@1inch/byte-utils");
const { Resolver } = require("./resolver.cjs");
const { JsonRpcProvider } = require("ethers");
const { config } = require("../config/tron.js");
const { TronWeb } = require("tronweb");
const { createOrder } = require("./order.cjs");
const { Address } = Sdk;
const { Wallet } = require("./wallet.js");

// Use Nile testnet
const tronWeb = new TronWeb({
    fullHost: config.src.RpcUrl,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: config.src.ResolverPrivateKey,
  });

const resolver = new Resolver(
  config.src.ResolverContractAddress,
  config.src.LOP,
  tronWeb
);

const EvmChainUser = new Wallet(
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

  // sign order
  const signature = await EvmChainUser.signOrder(config.src.ChainId, order, config.src.LOP);

  // fill order
  console.log("Filling new order...");
  const fillOrder = await resolver.deploySrc(
    config.src.ChainId,
    order,
    signature,
    Sdk.TakerTraits.default()
          .setExtension(order.extension)
          .setAmountMode(Sdk.AmountMode.maker)
          .setAmountThreshold(order.takingAmount),
    order.makingAmount
  )
  console.log("Order filled successfully:", fillOrder);
}

main();
