const dotenv = require("dotenv");
dotenv.config();

const inquirer = require("inquirer");
const Sdk = require("@1inch/cross-chain-sdk");
const { parseUnits, formatUnits } = require("ethers");
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
const { hexToTronAddress } = require("./utils/tron.cjs");

// Token information for tron>evm direction
const TOKENS = {
  tron: {
    ITRC: {
      name: "ITRC Token",
      address: config.src.ITRC,
      decimals: 18,
      symbol: "ITRC"
    }
  },
  evm: {
    BLT: {
      name: "BLT Token", 
      address: config.dst.BLT,
      decimals: 18,
      symbol: "BLT"
    }
  }
};

// Initialize TronWeb
const tronWeb = new TronWeb({
    fullHost: config.src.RpcUrl,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: config.src.ResolverPrivateKey,
});

// Initialize resolvers
const tronResolver = new TronResolver(
  config.src.ResolverContractAddress,
  config.src.LOP,
  tronWeb
);

const evmResolver = new EvmResolver(
  config.dst.ResolverContractAddress,
  config.src.ResolverContractAddress
);

// Initialize wallets
const EvmUserWallet = new EVMWallet(
  config.src.UserPrivateKey,
  new JsonRpcProvider(config.dst.RpcUrl)
);

const EvmResolverWallet = new EVMWallet(
  config.dst.ResolverPrivateKey,
  new JsonRpcProvider(config.dst.RpcUrl)
);

// Initialize escrow factories
const srcEscrowFactory = new TronEscrowFactory(
  config.src.EscrowFactory,
  tronWeb
);

const dstEscrowFactory = new EvmEscrowFactory(
  new JsonRpcProvider(config.dst.RpcUrl),
  config.dst.EscrowFactory,
);

// Initialize indexer
const tronIndexer = new TronIndexer(process.env.TRONGRID_API_KEY, 'nile');

async function selectToken(chain, message) {
  const tokens = TOKENS[chain];
  const choices = Object.keys(tokens).map(key => ({
    name: `${tokens[key].name} (${tokens[key].symbol})`,
    value: key
  }));

  const { selectedToken } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedToken',
      message: message,
      choices: choices
    }
  ]);

  return tokens[selectedToken];
}

async function getAmount(token, message) {
  const { amount } = await inquirer.prompt([
    {
      type: 'input',
      name: 'amount',
      message: `${message} (${token.symbol})`,
      validate: (input) => {
        const num = parseFloat(input);
        if (isNaN(num) || num <= 0) {
          return 'Please enter a valid positive number';
        }
        return true;
      }
    }
  ]);

  return parseUnits(amount, token.decimals);
}

async function confirmOrder(order, srcToken, dstToken) {
  console.log('\n=== ORDER SUMMARY ===');
  console.log(`Source Token: ${srcToken.name} (${srcToken.symbol})`);
  console.log(`Destination Token: ${dstToken.name} (${dstToken.symbol})`);
  console.log(`Making Amount: ${formatUnits(order.makingAmount, srcToken.decimals)} ${srcToken.symbol}`);
  console.log(`Taking Amount: ${formatUnits(order.takingAmount, dstToken.decimals)} ${dstToken.symbol}`);
  console.log(`Salt: ${order.salt.toString()}`);
  console.log(`Maker: ${order.maker.toString()}`);
  console.log('=====================\n');

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to proceed with this order?',
      default: false
    }
  ]);

  return confirm;
}

async function confirmSignature() {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Ready to sign the order?',
      default: false
    }
  ]);

  return confirm;
}

async function confirmFill() {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Ready to fill the order?',
      default: false
    }
  ]);

  return confirm;
}

async function confirmWithdraw() {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Ready to withdraw from escrows?',
      default: false
    }
  ]);

  return confirm;
}

async function executeTronToEvmOrder() {
  try {
    console.log('🔄 Executing Tron → EVM Order\n');

    // Step 1: Select source token (Tron)
    console.log('📤 Step 1: Select source token (Tron)');
    const srcToken = await selectToken('tron', 'Select source token:');

    // Step 2: Select destination token (EVM)
    console.log('\n📥 Step 2: Select destination token (EVM)');
    const dstToken = await selectToken('evm', 'Select destination token:');

    // Step 3: Enter making amount
    console.log('\n💰 Step 3: Enter making amount');
    const makingAmount = await getAmount(srcToken, 'Enter making amount');

    // Step 4: Enter taking amount
    console.log('\n💰 Step 4: Enter taking amount');
    const takingAmount = await getAmount(dstToken, 'Enter taking amount');

    // Initialize escrow factory
    await srcEscrowFactory.init();

    // Get user address
    const srcChainUserAddress = tronWeb.address.fromPrivateKey(config.src.UserPrivateKey);

    // Create order
    console.log('\n📋 Step 5: Creating order...');
    const secret = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const srcTimestamp = BigInt(Math.floor(Date.now() / 1000));

    const order = await createOrder(
      config.src.EscrowFactory,
      srcChainUserAddress,
      srcChainUserAddress,
      makingAmount,
      takingAmount,
      srcToken.address,
      dstToken.address,
      secret,
      config.src.ChainId,
      config.dst.ChainId,
      config.src.ResolverContractAddress,
      srcTimestamp
    );

    console.log('✅ Order created successfully!');
    console.log(`Salt: ${order.salt.toString()}`);

    // Step 6: Confirm order
    const orderConfirmed = await confirmOrder(order, srcToken, dstToken);
    if (!orderConfirmed) {
      console.log('❌ Order cancelled by user');
      return;
    }

    // Step 7: Sign order
    console.log('\n✍️  Step 6: Signing order...');
    const signatureConfirmed = await confirmSignature();
    if (!signatureConfirmed) {
      console.log('❌ Signature cancelled by user');
      return;
    }

    const signature = await EvmUserWallet.signOrder(config.src.ChainId, order, config.src.LOP);
    console.log('✅ Order signed successfully!');

    // Step 8: Fill order
    console.log('\n🔄 Step 7: Filling order...');
    const fillConfirmed = await confirmFill();
    if (!fillConfirmed) {
      console.log('❌ Order fill cancelled by user');
      return;
    }

    console.log('⏳ Filling order...');
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
      );
    console.log('✅ Order filled successfully!');
    console.log(`Transaction Hash: ${orderFillHash}`);

    // Step 9: Wait for escrow events
    console.log('\n🔍 Step 8: Fetching escrow events...');
    console.log('⏳ Waiting for source escrow creation event...');
    const [immutables, complement] = await tronIndexer.waitForSrcEscrowCreatedEvent(orderFillHash);
    console.log('✅ Source escrow event received!');

    // Step 10: Deploy destination escrow
    console.log('\n🏗️  Step 9: Deploying destination escrow...');
    console.log('Creating destination escrow immutables...');
    const dstImmutables = immutables
      .withComplement(complement)
      .withTaker(new Address(config.dst.ResolverContractAddress));

    console.log('⏳ Deploying destination escrow...');
    const { txHash: dstDepositHash, blockTimestamp: dstDeployedAt } =
      await EvmResolverWallet.send(evmResolver.deployDst(dstImmutables));
    console.log('✅ Destination escrow deployed successfully!');
    console.log(`Transaction Hash: ${dstDepositHash}`);

    // Step 11: Get escrow addresses
    console.log('\n📍 Step 10: Getting escrow addresses...');
    const srcEscrowAddress = await srcEscrowFactory.addressOfEscrowSrc(immutables);
    const ESCROW_DST_IMPLEMENTATION = await dstEscrowFactory.getDestinationImpl();
    const dstEscrowAddress = new Sdk.EscrowFactory(
      new Address(config.dst.EscrowFactory)
    ).getDstEscrowAddress(
      immutables,
      complement,
      dstDeployedAt,
      new Address(config.dst.ResolverContractAddress),
      ESCROW_DST_IMPLEMENTATION
    );

    console.log('✅ Escrow addresses retrieved!');
    console.log(`Source Escrow: ${srcEscrowAddress.toString()}`);
    console.log(`Source Escrow (Tron Format): ${hexToTronAddress(srcEscrowAddress.toString())}`);
    console.log(`Destination Escrow: ${dstEscrowAddress.toString()}`);

    // Step 12: Withdraw from escrows
    console.log('\n💸 Step 11: Withdrawing from escrows...');
    const withdrawConfirmed = await confirmWithdraw();
    if (!withdrawConfirmed) {
      console.log('❌ Withdrawal cancelled by user');
      return;
    }

    console.log('⏳ Waiting 10 seconds before withdrawal...');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Withdraw from destination escrow
    console.log('⏳ Withdrawing from destination escrow...');
    const { txHash: dstWithdrawHash } = await EvmResolverWallet.send(
      evmResolver.withdraw(
        "dst",
        dstEscrowAddress,
        secret,
        dstImmutables.withDeployedAt(dstDeployedAt)
      )
    );
    console.log('✅ Destination escrow withdrawn successfully!');
    console.log(`Transaction Hash: ${dstWithdrawHash}`);

    // Withdraw from source escrow
    console.log('⏳ Withdrawing from source escrow...');
    const { txHash: resolverWithdrawHash } = await tronResolver.withdraw(
      "src",
      srcEscrowAddress,
      secret,
      immutables
    );
    console.log('✅ Source escrow withdrawn successfully!');
    console.log(`Transaction Hash: ${resolverWithdrawHash}`);

    console.log('\n🎉 Tron → EVM Order lifecycle completed successfully!');
    console.log('\n📊 Transaction Summary:');
    console.log(`- Order Fill: ${orderFillHash}`);
    console.log(`- Destination Escrow Deploy: ${dstDepositHash}`);
    console.log(`- Destination Withdraw: ${dstWithdrawHash}`);
    console.log(`- Source Withdraw: ${resolverWithdrawHash}`);

  } catch (error) {
    console.error('❌ Error during Tron → EVM order lifecycle:', error.message);
    console.error(error.stack);
  }
}

async function executeOrderLifecycle() {
  try {
    console.log('🚀 Welcome to the 1inch Cross-Chain Order CLI!');
    console.log('📤 Direction: Tron → EVM\n');

    await executeTronToEvmOrder();

  } catch (error) {
    console.error('❌ Error during order lifecycle:', error.message);
    console.error(error.stack);
  }
}

// Main CLI function
async function main() {
  try {
    await executeOrderLifecycle();
  } catch (error) {
    console.error('❌ CLI Error:', error.message);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { executeOrderLifecycle }; 