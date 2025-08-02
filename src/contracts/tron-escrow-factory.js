const Sdk = require("@1inch/cross-chain-sdk");
const { readFileSync } = require("fs");
const { removePrefix } = require("../utils/tron.cjs");
const { Address } = Sdk;

// Load the ABI
const abiData = JSON.parse(readFileSync('./abi/EscrowFactory.json', 'utf8'));
const contractABI = abiData.abi;

class TronEscrowFactory {
  constructor(address, tronWeb) {
    this.address = address;
    this.tronWeb = tronWeb;
    this.contract = null;
  }

  async init() {
    const tronAddress = this.tronWeb.address.fromHex(this.address);
    this.contract = await this.tronWeb.contract(contractABI, tronAddress);
  }

  async getSourceImpl() {
    const res = await this.contract.ESCROW_SRC_IMPLEMENTATION().call();
    const srcAddress = removePrefix(res)
    return new Address(srcAddress);
  }

  async getDestinationImpl() {
    const res = await this.contract.ESCROW_DST_IMPLEMENTATION().call();
    const dstAddress = removePrefix(res)
    return Sdk.Address.fromBigInt(BigInt(dstAddress));
  }

  async addressOfEscrowSrc(immutables) {
    const res = await this.contract.addressOfEscrowSrc(immutables).call();
    const escrowAddress = removePrefix(res)
    return new Address(escrowAddress);
  }

  async addressOfEscrowDst(immutables) {
    const res = await this.contract.addressOfEscrowDst(immutables).call();
    const escrowAddress = removePrefix(res)
    return Sdk.Address.fromBigInt(BigInt(escrowAddress));
  }
}

module.exports = { TronEscrowFactory };
