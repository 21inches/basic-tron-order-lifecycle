const { Signature, ethers } = require("ethers");
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

  async getSrcDeployEvent(blockHash) {
    // Get the event signature for SrcEscrowCreated
    const eventSignature = "SrcEscrowCreated((bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,uint256),(uint256,uint256,uint256,uint256,uint256))";
    const eventTopic = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
    
    // Get logs from TronWeb
    const logs = await this.tronWeb.getEventResult(this.address, {
      eventName: 'SrcEscrowCreated',
      blockHash: blockHash,
      topics: [eventTopic]
    });

    if (!logs || logs.length === 0) {
      throw new Error('No SrcEscrowCreated event found in block');
    }

    const log = logs[0];
    
    // Decode the event data
    const iface = new ethers.utils.Interface(contractABI);
    const decodedData = iface.decodeEventLog('SrcEscrowCreated', log.data, log.topics);
    
    const immutables = decodedData.srcImmutables;
    const complement = decodedData.dstImmutablesComplement;

    return [
      Sdk.Immutables.new({
        orderHash: immutables.orderHash,
        hashLock: Sdk.HashLock.fromString(immutables.hashlock),
        maker: Sdk.Address.fromBigInt(immutables.maker),
        taker: Sdk.Address.fromBigInt(immutables.taker),
        token: Sdk.Address.fromBigInt(immutables.token),
        amount: immutables.amount,
        safetyDeposit: immutables.safetyDeposit,
        timeLocks: Sdk.TimeLocks.fromBigInt(immutables.timelocks),
      }),
      Sdk.DstImmutablesComplement.new({
        maker: Sdk.Address.fromBigInt(complement.maker),
        amount: complement.amount,
        token: Sdk.Address.fromBigInt(complement.token),
        safetyDeposit: complement.safetyDeposit,
        chainId: complement.chainId,
      }),
    ];
  }
}

module.exports = { EscrowFactory };
