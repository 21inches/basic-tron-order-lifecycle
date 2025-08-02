const { Signature, ethers } = require("ethers");
const Sdk = require("@1inch/cross-chain-sdk");
const { readFileSync } = require("fs");
const { hexToTronAddress, isValidTronHexAddress } = require("../utils/tron.cjs");

// Load the ABI
const abiData = JSON.parse(readFileSync('./abi/EscrowFactory.json', 'utf8'));
const contractABI = abiData.abi;

class Resolver {
  constructor(address, tronWeb) {
    this.address = address;
    this.tronWeb = tronWeb;
  }

  async getSourceImpl() {
    const contract = await this.tronWeb.contract(contractABI, this.getSourceImpl());
    const srcAddress = await contract.EscrowSrcImplementationAddress
    return Sdk.Address.fromBigInt(BigInt(srcAddress));
  }
}

module.exports = { Resolver };
