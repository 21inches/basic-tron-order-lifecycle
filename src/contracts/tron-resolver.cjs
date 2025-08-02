const { Signature, ethers } = require("ethers");
const Sdk = require("@1inch/cross-chain-sdk");
const { readFileSync } = require("fs");
const { hexToTronAddress } = require("../utils/tron.cjs");

// Load the ABI
const abiData = JSON.parse(readFileSync('./abi/Resolver.json', 'utf8'));
const contractABI = abiData.abi;

class TronResolver {
  constructor(resolverAddress, lopAddress, tronWeb) {
    this.ResolverAddress = resolverAddress;
    this.lopAddress = lopAddress;
    this.tronWeb = tronWeb;
  }

  async deploySrcOnTron(
    chainId,
    order,
    signature,
    takerTraits,
    amount,
    hashLock = order.escrowExtension.hashLockInfo
  ) {
    // Convert hex address to TRON format for TronWeb
    const tronAddress = hexToTronAddress(this.ResolverAddress);

    // Check if contract exists on the network
    try {
      const contractInfo = await this.tronWeb.trx.getContract(tronAddress);
      if (!contractInfo || !contractInfo.bytecode) {
        throw new Error(`Contract not found at address ${tronAddress}`);
      }
    } catch (error) {
      console.error("🔍 Error checking contract:", error.message);
      throw new Error(`Contract not deployed or not found at address ${tronAddress}`);
    }
    
    const contract = await this.tronWeb.contract(contractABI, tronAddress);

    const { r, yParityAndS: vs } = Signature.from(signature);
    const { args, trait } = takerTraits.encode();
    
    // Get the immutables from the order
    const orderImmutables = order.toSrcImmutables(
      chainId,
      new Sdk.Address(this.ResolverAddress),
      amount,
      hashLock
    ).build();
    
    const hash = this.hashOrder(chainId, order);
    
    // Pass immutables as an array instead of an object
    const immutables = [
      hash, // orderHash
      orderImmutables.hashlock, // hashlock
      orderImmutables.maker, // maker
      orderImmutables.taker, // taker
      orderImmutables.token, // token
      orderImmutables.amount, // amount
      orderImmutables.safetyDeposit, // safetyDeposit
      orderImmutables.timelocks // timelocks
    ];

    // Get order as object and convert to array
    const orderObj = order.build();
    const orderArray = [
      orderObj.salt,
      orderObj.maker,
      orderObj.receiver,
      orderObj.makerAsset,
      orderObj.takerAsset,
      orderObj.makingAmount,
      orderObj.takingAmount,
      orderObj.makerTraits
    ];

    const value = order.escrowExtension.srcSafetyDeposit

    console.log("🔍 About to call deploySrc with:");
    console.log("  - immutables:", immutables);
    console.log("  - orderArray:", orderArray);
    console.log("  - r:", r);
    console.log("  - vs:", vs);
    console.log("  - amount:", amount);
    console.log("  - trait:", trait);
    console.log("  - args:", args);
    console.log("  - value:", value);

    const addressOfEscrowSrctx = await contract.addressOfEscrowSrc(
      immutables,
      orderArray,
      r,
      vs,
      amount,
      trait,
      args,
    ).call();
    console.log("🔍 Address of Escrow Src:", addressOfEscrowSrctx);

    const tx = await contract.deploySrc(
      immutables,
      orderArray,
      r,
      vs,
      amount,
      trait,
      args,
    ).send({
      callValue: value,
    });

    console.log("🔍 Transaction sent successfully:", tx);
    
    // Get transaction info to extract block hash
    const txInfo = await this.tronWeb.trx.getTransactionInfo(tx);
    const blockHash = txInfo.blockHash;
    
    return {
      txHash: tx,
      blockHash: blockHash
    };
  }

  hashOrder(srcChainId, order) {
    const typedData = order.getTypedData(srcChainId);
    const domain = {
      name: "1inch Limit Order Protocol",
      version: "4",
      chainId: srcChainId,
      verifyingContract: this.lopAddress,
    };
    return ethers.TypedDataEncoder.hash(
      domain,
      { Order: typedData.types[typedData.primaryType] },
      typedData.message
    );
  }

  async withdraw(side, escrow, secret, immutables) {
    // Convert hex address to TRON format for TronWeb
    const tronAddress = hexToTronAddress(this.ResolverAddress);
    const contract = await this.tronWeb.contract(contractABI, tronAddress);

    const tx = await contract.withdraw(
      escrow.toString(),
      secret,
      immutables.build()
    ).send();

    return {
      txHash: tx
    };
  }
}

module.exports = { TronResolver };
