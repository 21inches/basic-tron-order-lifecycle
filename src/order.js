const Sdk = require("@1inch/cross-chain-sdk");


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
    if (srcChainId == 728126428 || srcChainId == 3448148188) { // TRON & NILE
      srcChainUserAddress = tronAddressToHex(srcChainUserAddress)
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
          srcWithdrawal: 10n, // 10sec finality lock for test
          srcPublicWithdrawal: 120n, // 2m for private withdrawal
          srcCancellation: 121n, // 1sec public withdrawal
          srcPublicCancellation: 122n, // 1sec private cancellation
          dstWithdrawal: 10n, // 10sec finality lock for test
          dstPublicWithdrawal: 100n, // 100sec private withdrawal
          dstCancellation: 101n, // 1sec public withdrawal
        }),
        srcChainId,
        dstChainId,
        srcSafetyDeposit: parseUnits("0.001", 6),
        dstSafetyDeposit: parseUnits("0.001", 6),
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