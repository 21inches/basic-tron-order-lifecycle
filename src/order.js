const Sdk = require("@1inch/cross-chain-sdk");
const { UINT_40_MAX } = require("@1inch/byte-utils");
const { parseUnits } = require("ethers");
const { config } = require("../config/tron.js");
const { tronAddressToHex } = require("./utils/tron.js");

const { Address, CrossChainOrder, HashLock, TimeLocks, AuctionDetails, randBigInt } = Sdk;

// Chain IDs
const CHAIN_IDS = {
  TRON_MAINNET: 728126428,
  TRON_NILE: 3448148188,
};

// Default time lock values (in seconds)
const DEFAULT_TIME_LOCKS = {
  srcWithdrawal: 10n,
  srcPublicWithdrawal: 120n,
  srcCancellation: 121n,
  srcPublicCancellation: 122n,
  dstWithdrawal: 10n,
  dstPublicWithdrawal: 100n,
  dstCancellation: 101n,
};

// Default auction settings
const DEFAULT_AUCTION = {
  initialRateBump: 0,
  duration: 120n,
};

// Default safety deposits
const DEFAULT_SAFETY_DEPOSITS = {
  src: "0.001",
  dst: "0.001",
  decimals: 6,
};



/**
 * Validates order parameters
 * @param {Object} params - Order parameters
 * @throws {Error} If validation fails
 */
function validateOrderParams(params) {
  const {
    escrowFactoryAddress,
    srcChainUserAddress,
    makingAmount,
    takingAmount,
    srcTokenAddress,
    dstTokenAddress,
    secret,
    srcChainId,
    dstChainId,
    resolverAddress,
    srcTimestamp,
  } = params;

  if (!escrowFactoryAddress) throw new Error("escrowFactoryAddress is required");
  if (!srcChainUserAddress) throw new Error("srcChainUserAddress is required");
  if (!makingAmount) throw new Error("makingAmount is required");
  if (!takingAmount) throw new Error("takingAmount is required");
  if (!srcTokenAddress) throw new Error("srcTokenAddress is required");
  if (!dstTokenAddress) throw new Error("dstTokenAddress is required");
  if (!secret) throw new Error("secret is required");
  if (!srcChainId) throw new Error("srcChainId is required");
  if (!dstChainId) throw new Error("dstChainId is required");
  if (!resolverAddress) throw new Error("resolverAddress is required");
  if (!srcTimestamp) throw new Error("srcTimestamp is required");
}

/**
 * Creates order details object
 * @param {Object} params - Order parameters
 * @returns {Object} Order details
 */
function createOrderDetails(params) {
  const {
    escrowFactoryAddress,
    srcChainUserAddress,
    makingAmount,
    takingAmount,
    srcTokenAddress,
    dstTokenAddress,
  } = params;

  return {
    salt: randBigInt(1000n),
    maker: new Address(srcChainUserAddress),
    makingAmount,
    takingAmount,
    makerAsset: new Address(srcTokenAddress),
    takerAsset: new Address(dstTokenAddress),
  };
}

/**
 * Creates cross-chain details object
 * @param {Object} params - Order parameters
 * @param {Object} options - Optional configuration
 * @returns {Object} Cross-chain details
 */
function createCrossChainDetails(params, options = {}) {
  const {
    secret,
    srcChainId,
    dstChainId,
  } = params;

  const timeLocks = options.timeLocks || DEFAULT_TIME_LOCKS;
  const safetyDeposits = options.safetyDeposits || DEFAULT_SAFETY_DEPOSITS;

  return {
    hashLock: HashLock.forSingleFill(secret),
    timeLocks: TimeLocks.new(timeLocks),
    srcChainId,
    dstChainId,
    srcSafetyDeposit: parseUnits(safetyDeposits.src, safetyDeposits.decimals),
    dstSafetyDeposit: parseUnits(safetyDeposits.dst, safetyDeposits.decimals),
  };
}

/**
 * Creates auction details object
 * @param {Object} params - Order parameters
 * @param {Object} options - Optional configuration
 * @returns {Object} Auction details
 */
function createAuctionDetails(params, options = {}) {
  const { srcTimestamp } = params;
  const auction = options.auction || DEFAULT_AUCTION;

  return {
    auction: new Sdk.AuctionDetails({
      initialRateBump: auction.initialRateBump,
      points: auction.points || [],
      duration: auction.duration,
      startTime: srcTimestamp,
    }),
  };
}

/**
 * Creates whitelist configuration
 * @param {string} resolverAddress - Resolver address
 * @returns {Object} Whitelist configuration
 */
function createWhitelist(resolverAddress) {
  return {
    whitelist: [
      {
        address: new Address(resolverAddress),
        allowFrom: 0n,
      },
    ],
    resolvingStartTime: 0n,
  };
}

/**
 * Creates order options
 * @param {Object} options - Optional configuration
 * @returns {Object} Order options
 */
function createOrderOptions(options = {}) {
  return {
    nonce: Sdk.randBigInt(UINT_40_MAX),
    allowPartialFills: options.allowPartialFills || false,
    allowMultipleFills: options.allowMultipleFills || false,
  };
}

/**
 * Creates a new cross-chain order
 * @param {Object} params - Order parameters
 * @param {string} params.escrowFactoryAddress - Escrow factory address
 * @param {string} params.srcChainUserAddress - Source chain user address
 * @param {bigint} params.makingAmount - Making amount
 * @param {bigint} params.takingAmount - Taking amount
 * @param {string} params.srcTokenAddress - Source token address
 * @param {string} params.dstTokenAddress - Destination token address
 * @param {string} params.secret - Secret for hash lock
 * @param {number} params.srcChainId - Source chain ID
 * @param {number} params.dstChainId - Destination chain ID
 * @param {string} params.resolverAddress - Resolver address
 * @param {bigint} params.srcTimestamp - Source timestamp
 * @param {Object} options - Optional configuration
 * @returns {Object} Cross-chain order
 * @throws {Error} If validation fails or order creation fails
 */
export async function createOrder(params, options = {}) {
  try {
    // Validate input parameters
    validateOrderParams(params);

    // Convert TRON address if needed
    let { srcChainUserAddress } = params;
    if (params.srcChainId === CHAIN_IDS.TRON_MAINNET || params.srcChainId === CHAIN_IDS.TRON_NILE) {
      srcChainUserAddress = tronAddressToHex(srcChainUserAddress);
    }

    // Create order components
    const orderDetails = createOrderDetails({
      ...params,
      srcChainUserAddress,
    });

    const crossChainDetails = createCrossChainDetails(params, options);
    const auctionDetails = createAuctionDetails(params, options);
    const whitelist = createWhitelist(params.resolverAddress);
    const orderOptions = createOrderOptions(options);

    // Create the order
    const order = Sdk.CrossChainOrder.new(
      new Address(params.escrowFactoryAddress),
      orderDetails,
      crossChainDetails,
      {
        ...auctionDetails,
        ...whitelist,
      },
      orderOptions
    );

    return order;
  } catch (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }
}

/**
 * Creates a default order with common TRON configuration
 * @param {Object} params - Basic order parameters
 * @returns {Object} Cross-chain order
 */
export async function createTronOrder(params) {
  const defaultOptions = {
    timeLocks: DEFAULT_TIME_LOCKS,
    safetyDeposits: DEFAULT_SAFETY_DEPOSITS,
    auction: DEFAULT_AUCTION,
    allowPartialFills: false,
    allowMultipleFills: false,
  };

  return createOrder(params, defaultOptions);
}

// Export constants for external use
export {
  CHAIN_IDS,
  DEFAULT_TIME_LOCKS,
  DEFAULT_AUCTION,
  DEFAULT_SAFETY_DEPOSITS,
  UINT_40_MAX,
};