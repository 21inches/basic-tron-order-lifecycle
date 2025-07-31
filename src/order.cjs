
const { parseEther } = require("ethers");
const Sdk = require("@1inch/cross-chain-sdk");
const { UINT_40_MAX } = require("@1inch/byte-utils");
const { Address } = Sdk;
const { tronAddressToHex } = require("./utils/tron.cjs");

// Chain IDs
const CHAIN_IDS = {
    TRON_MAINNET: 728126428,
    TRON_NILE: 3448148188,
};

async function createOrder(
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
  srcTimestamp
) {
    console.log("createOrder");
    console.log("srcChainUserAddress", srcChainUserAddress);
    console.log("resolverAddress", resolverAddress);

    // Convert TRON address if needed
    if (srcChainId === CHAIN_IDS.TRON_MAINNET || srcChainId === CHAIN_IDS.TRON_NILE) {
      srcChainUserAddress = tronAddressToHex(srcChainUserAddress);
    }


  const order = Sdk.CrossChainOrder.new(
    new Address(escrowFactoryAddress),
    {
      salt: Sdk.randBigInt(1000n),
      maker: new Address(srcChainUserAddress),
      makingAmount,
      takingAmount,
      makerAsset: new Address(srcTokenAddress),
      takerAsset: new Address(dstTokenAddress),
    },
    {
      hashLock: Sdk.HashLock.forSingleFill(secret),
      timeLocks: Sdk.TimeLocks.new({
        srcWithdrawal: 10n,
        srcPublicWithdrawal: 120n,
        srcCancellation: 121n,
        srcPublicCancellation: 122n,
        dstWithdrawal: 10n,
        dstPublicWithdrawal: 100n,
        dstCancellation: 101n,
      }),
      srcChainId,
      dstChainId,
      srcSafetyDeposit: parseEther("0.001"),
      dstSafetyDeposit: parseEther("0.001"),
    },
    {
      auction: new Sdk.AuctionDetails({
        initialRateBump: 0,
        points: [],
        duration: 120n,
        startTime: srcTimestamp,
      }),
      whitelist: [
        {
          address: new Address(resolverAddress),
          allowFrom: 0n,
        },
      ],
      resolvingStartTime: 0n,
    },
    {
      nonce: Sdk.randBigInt(UINT_40_MAX),
      allowPartialFills: false,
      allowMultipleFills: false,
    }
  );

  return order;
}

module.exports = { createOrder };