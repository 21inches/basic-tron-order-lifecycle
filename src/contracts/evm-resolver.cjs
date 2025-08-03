const { Interface, Signature } = require("ethers");
const Sdk = require("@1inch/cross-chain-sdk");
const { readFileSync } = require("fs");
const { ethers } = require("ethers");

// Load the ABI
const abiData = JSON.parse(readFileSync('./abi/Resolver.json', 'utf8'));
const contractABI = abiData.abi;

class EvmResolver {
  iface = new Interface(contractABI);

  constructor(evmAddress, tronAddress) {
    this.evmAddress = evmAddress;
    this.tronAddress = tronAddress;
  }

  deploySrc(
    chainId,
    order,
    signature,
    takerTraits,
    amount,
    hashLock = order.escrowExtension.hashLockInfo,
    LOPAddress
  ) {
    const { r, yParityAndS: vs } = Signature.from(signature);
    const { args, trait } = takerTraits.encode();
    const immutables = order.toSrcImmutables(
      chainId,
      new Sdk.Address(this.evmAddress),
      amount,
      hashLock
    ).build();
    const hash = this.hashOrder(chainId, order, LOPAddress);
    immutables.orderHash = hash;

    return {
      to: this.evmAddress,
      data: this.iface.encodeFunctionData("deploySrc", [
        immutables,
        order.build(),
        r,
        vs,
        amount,
        trait,
        args,
      ]),
      value: order.escrowExtension.srcSafetyDeposit,
    };
  }

  hashOrder(srcChainId, order, LOPAddress) {
    const typedData = order.getTypedData(srcChainId);
    const domain = {
      name: "1inch Limit Order Protocol",
      version: "4",
      chainId: srcChainId,
      verifyingContract: LOPAddress,
    };
    return ethers.TypedDataEncoder.hash(
      domain,
      { Order: typedData.types[typedData.primaryType] },
      typedData.message
    );
  }

  deployDst(immutables) {
    return {
      to: this.tronAddress,
      data: this.iface.encodeFunctionData("deployDst", [
        immutables.build(),
        immutables.timeLocks.toSrcTimeLocks().privateCancellation,
      ]),
      value: immutables.safetyDeposit,
    };
  }

  withdraw(side, escrow, secret, immutables) {
    return {
      to: side === "src" ? this.evmAddress : this.tronAddress,
      data: this.iface.encodeFunctionData("withdraw", [
        escrow.toString(),
        secret,
        immutables.build(),
      ]),
    };
  }

  cancel(side, escrow, immutables) {
    return {
      to: side === "src" ? this.evmAddress : this.tronAddress,
      data: this.iface.encodeFunctionData("cancel", [
        escrow.toString(),
        immutables.build(),
      ]),
    };
  }
}

module.exports = { EvmResolver };
