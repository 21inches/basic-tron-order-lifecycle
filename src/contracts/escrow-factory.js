const Sdk = require("@1inch/cross-chain-sdk");
const { readFileSync } = require("fs");
const { hexToTronAddress, isValidTronHexAddress } = require("../utils/tron.cjs");

// Load the ABI
const abiData = JSON.parse(readFileSync('./abi/EscrowFactory.json', 'utf8'));
const contractABI = abiData.abi;

class EscrowFactory {
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
    const srcAddress = await this.contract.ESCROW_SRC_IMPLEMENTATION().call();
    return Sdk.Address.fromBigInt(BigInt(srcAddress));
  }

  async getDestinationImpl() {
    const dstAddress = await this.contract.ESCROW_DST_IMPLEMENTATION().call();
    return Sdk.Address.fromBigInt(BigInt(dstAddress));
  }

  async getFeeBank() {
    const feeBankAddress = await this.contract.FEE_BANK().call();
    return Sdk.Address.fromBigInt(BigInt(feeBankAddress));
  }

  async addressOfEscrowSrc(immutables) {
    const escrowAddress = await this.contract.addressOfEscrowSrc(immutables).call();
    return Sdk.Address.fromBigInt(BigInt(escrowAddress));
  }

  async addressOfEscrowDst(immutables) {
    const escrowAddress = await this.contract.addressOfEscrowDst(immutables).call();
    return Sdk.Address.fromBigInt(BigInt(escrowAddress));
  }

  async availableCredit(account) {
    const credit = await this.contract.availableCredit(account).call();
    return BigInt(credit);
  }

  async createDstEscrow(dstImmutables, srcCancellationTimestamp) {
    return await this.contract.createDstEscrow(dstImmutables, srcCancellationTimestamp).send();
  }
}

module.exports = { EscrowFactory };
