const { id, Interface } = require("ethers");
const Sdk = require("@1inch/cross-chain-sdk");
const { readFileSync } = require("fs");

// Load the ABI
const abiData = JSON.parse(readFileSync('./abi/EscrowFactory.json', 'utf8'));
const contractABI = abiData.abi;

class EvmEscrowFactory {
  iface = new Interface(contractABI);

  constructor(provider, address) {
    this.provider = provider;
    this.address = address;
  }

  async getSourceImpl() {
    return Sdk.Address.fromBigInt(
      BigInt(
        await this.provider.call({
          to: this.address,
          data: id("ESCROW_SRC_IMPLEMENTATION()").slice(0, 10),
        })
      )
    );
  }

  async getDestinationImpl() {
    return Sdk.Address.fromBigInt(
      BigInt(
        await this.provider.call({
          to: this.address,
          data: id("ESCROW_DST_IMPLEMENTATION()").slice(0, 10),
        })
      )
    );
  }

  async getSrcDeployEvent(blockHash) {
    const event = this.iface.getEvent("SrcEscrowCreated");
    const logs = await this.provider.getLogs({
      blockHash,
      address: this.address,
      topics: [event.topicHash],
    });

    const [data] = logs.map((l) => this.iface.decodeEventLog(event, l.data));

    const immutables = data.at(0);
    const complement = data.at(1);

    return [
      Sdk.Immutables.new({
        orderHash: immutables[0],
        hashLock: Sdk.HashLock.fromString(immutables[1]),
        maker: Sdk.Address.fromBigInt(immutables[2]),
        taker: Sdk.Address.fromBigInt(immutables[3]),
        token: Sdk.Address.fromBigInt(immutables[4]),
        amount: immutables[5],
        safetyDeposit: immutables[6],
        timeLocks: Sdk.TimeLocks.fromBigInt(immutables[7]),
      }),
      Sdk.DstImmutablesComplement.new({
        maker: Sdk.Address.fromBigInt(complement[0]),
        amount: complement[1],
        token: Sdk.Address.fromBigInt(complement[2]),
        safetyDeposit: complement[3],
      }),
    ];
  }
}

module.exports = { EvmEscrowFactory };
