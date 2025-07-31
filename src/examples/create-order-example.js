import { createOrder, createTronOrder, CHAIN_IDS } from '../order.js';
import { config } from '../../config/tron.js';

/**
 * Example of creating a basic order
 */
async function createBasicOrderExample() {
  try {
    const orderParams = {
      escrowFactoryAddress: config.src.EscrowFactory,
      srcChainUserAddress: "TWS19imF8BnFKtB5Cm78w7s1nDdRtyZrsP",
      makingAmount: 1000000n, // 1 USDT (6 decimals)
      takingAmount: 1000000n, // 1 USDT equivalent
      srcTokenAddress: config.src.USDT,
      dstTokenAddress: config.dst.BLT,
      secret: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      srcChainId: CHAIN_IDS.TRON_NILE,
      dstChainId: config.dst.ChainId,
      resolverAddress: config.src.ResolverContractAddress,
      srcTimestamp: BigInt(Math.floor(Date.now() / 1000)),
    };

    const order = await createOrder(orderParams);
    console.log("Basic order created:", order);
    return order;
  } catch (error) {
    console.error("Error creating basic order:", error.message);
    throw error;
  }
}

/**
 * Example of creating an order with custom options
 */
async function createCustomOrderExample() {
  try {
    const orderParams = {
      escrowFactoryAddress: config.src.EscrowFactory,
      srcChainUserAddress: "TWS19imF8BnFKtB5Cm78w7s1nDdRtyZrsP",
      makingAmount: 5000000n, // 5 USDT
      takingAmount: 5000000n,
      srcTokenAddress: config.src.USDT,
      dstTokenAddress: config.dst.BLT,
      secret: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      srcChainId: CHAIN_IDS.TRON_NILE,
      dstChainId: config.dst.ChainId,
      resolverAddress: config.src.ResolverContractAddress,
      srcTimestamp: BigInt(Math.floor(Date.now() / 1000)),
    };

    const customOptions = {
      timeLocks: {
        srcWithdrawal: 30n, // 30 seconds
        srcPublicWithdrawal: 300n, // 5 minutes
        srcCancellation: 301n,
        srcPublicCancellation: 302n,
        dstWithdrawal: 30n,
        dstPublicWithdrawal: 300n,
        dstCancellation: 301n,
      },
      safetyDeposits: {
        src: "0.002",
        dst: "0.002",
        decimals: 6,
      },
      auction: {
        initialRateBump: 5,
        duration: 300n, // 5 minutes
        points: [],
      },
      allowPartialFills: true,
      allowMultipleFills: false,
    };

    const order = await createOrder(orderParams, customOptions);
    console.log("Custom order created:", order);
    return order;
  } catch (error) {
    console.error("Error creating custom order:", error.message);
    throw error;
  }
}

/**
 * Example of creating a TRON-specific order with default settings
 */
async function createTronOrderExample() {
  try {
    const orderParams = {
      escrowFactoryAddress: config.src.EscrowFactory,
      srcChainUserAddress: "TWS19imF8BnFKtB5Cm78w7s1nDdRtyZrsP",
      makingAmount: 2000000n, // 2 USDT
      takingAmount: 2000000n,
      srcTokenAddress: config.src.USDT,
      dstTokenAddress: config.dst.BLT,
      secret: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
      srcChainId: CHAIN_IDS.TRON_NILE,
      dstChainId: config.dst.ChainId,
      resolverAddress: config.src.ResolverContractAddress,
      srcTimestamp: BigInt(Math.floor(Date.now() / 1000)),
    };

    const order = await createTronOrder(orderParams);
    console.log("TRON order created:", order);
    return order;
  } catch (error) {
    console.error("Error creating TRON order:", error.message);
    throw error;
  }
}

/**
 * Example of error handling with invalid parameters
 */
async function createInvalidOrderExample() {
  try {
    const invalidParams = {
      // Missing required parameters
      escrowFactoryAddress: config.src.EscrowFactory,
      // srcChainUserAddress is missing
      makingAmount: 1000000n,
      takingAmount: 1000000n,
      srcTokenAddress: config.src.USDT,
      dstTokenAddress: config.dst.BLT,
      secret: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      srcChainId: CHAIN_IDS.TRON_NILE,
      dstChainId: config.dst.ChainId,
      resolverAddress: config.src.ResolverContractAddress,
      srcTimestamp: BigInt(Math.floor(Date.now() / 1000)),
    };

    const order = await createOrder(invalidParams);
    console.log("This should not be reached");
  } catch (error) {
    console.log("Expected error caught:", error.message);
  }
}

// Export examples for use in other files
export {
  createBasicOrderExample,
  createCustomOrderExample,
  createTronOrderExample,
  createInvalidOrderExample,
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Running order creation examples...\n");

  createBasicOrderExample()
    .then(() => createCustomOrderExample())
    .then(() => createTronOrderExample())
    .then(() => createInvalidOrderExample())
    .then(() => console.log("\nAll examples completed!"))
    .catch(error => console.error("Example failed:", error.message));
} 