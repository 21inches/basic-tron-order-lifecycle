const { Signature } = require("ethers");
const Sdk = require("@1inch/cross-chain-sdk");
const { readFileSync } = require("fs");
const { ethers } = require("ethers");

// Load the ABI
const abiData = JSON.parse(readFileSync('./abi/Resolver.json', 'utf8'));
const contractABI = abiData.abi;

class Resolver {
  constructor(srcAddress, lopAddress, contractAddress, tronWeb) {
    this.srcAddress = srcAddress;
    this.lopAddress = lopAddress;
    this.contractAddress = contractAddress;
    this.tronWeb = tronWeb;
  }

  async deploySrc(
    chainId,
    order,
    signature,
    takerTraits,
    amount,
    hashLock = order.escrowExtension.hashLockInfo
  ) {
    const contract = await this.tronWeb.contract(contractABI, this.contractAddress);

    const { r, yParityAndS: vs } = Signature.from(signature);
    const { args, trait } = takerTraits.encode();
    const immutables = order.toSrcImmutables(
      chainId,
      new Sdk.Address(this.srcAddress),
      amount,
      hashLock
    ).build();
    const hash = this.hashOrder(chainId, order);
    immutables.orderHash = hash;

    const value = order.escrowExtension.srcSafetyDeposit

    const tx = await contract.deploySrc(
      immutables,
      order.build(),
      r,
      vs,
      amount,
      trait,
      args,
    ).send({
      value: value,
    });

    return tx;
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
}

module.exports = { Resolver };
