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
  const typedData = order.getTypedData(config.src.ChainId);
  const domain = {
      name: '1inch Limit Order Protocol',
      version: '4',
      chainId: config.src.ChainId,
      verifyingContract: config.src.LOP
  };

  const hash = TypedDataEncoder.hash(domain, {
      Order: typedData.types[typedData.primaryType],
  }, typedData.message);

  const hashStripped = hash.replace(/^0x/, '');
  const signature = await tronWeb.trx.sign(hashStripped);
  console.log("Signature generated for new order");

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
