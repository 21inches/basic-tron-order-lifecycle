const axios = require('axios');
const { ethers } = require("ethers");
const Sdk = require("@1inch/cross-chain-sdk");
const { readFileSync } = require("fs");

// Load the ABI
const EscrowFactoryAbiData = JSON.parse(readFileSync('./abi/EscrowFactory.json', 'utf8'));

class TronIndexer {
  constructor(apiKey, network = 'nile') {
    this.apiKey = apiKey;
    this.baseUrl = network === 'mainnet' 
      ? 'https://api.trongrid.io' 
      : 'https://nile.trongrid.io';
    this.iEscrowFactory = new ethers.Interface(EscrowFactoryAbiData.abi);
  }

  async getTransactionInfo(txId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/wallet/gettransactioninfobyid`,
        { value: txId },
        {
          headers: {
            'Content-Type': 'application/json',
            'TRON-PRO-API-KEY': this.apiKey
          }
        }
      );
      return response.data;
    } catch (error) {
    }
  }

  async getSrcEscrowCreatedEventByTxId(txId) {
    const txInfo = await this.getTransactionInfo(txId);
    
    if (txInfo && txInfo.log) {
      for (const log of txInfo.log) {
        // Check if this log has the SrcEscrowCreated event signature
        const srcEscrowCreatedTopic = "0e534c62f0afd2fa0f0fa71198e8aa2d549f24daf2bb47de0d5486c7ce9288ca";
        
        if (log.topics && log.topics[0] === srcEscrowCreatedTopic) {
          // Manual decoding based on the event structure
          const data = log.data;
          
          // Extract the parameters from the data
          const srcImmutables = {
            orderHash: "0x" + data.substring(2, 66),
            hashlock: "0x" + data.substring(66, 130),
            maker: BigInt("0x" + data.substring(130, 194).substring(24)), // Convert to BigInt
            taker: BigInt("0x" + data.substring(194, 258).substring(24)), // Convert to BigInt
            token: BigInt("0x" + data.substring(258, 322).substring(24)), // Convert to BigInt
            amount: BigInt("0x" + data.substring(322, 386)),
            safetyDeposit: BigInt("0x" + data.substring(386, 450)),
            timelocks: BigInt("0x" + data.substring(450, 514))
          };
          
          const dstImmutablesComplement = {
            maker: BigInt("0x" + data.substring(514, 578).substring(24)), // Convert to BigInt
            amount: BigInt("0x" + data.substring(578, 642)),
            token: BigInt("0x" + data.substring(642, 706).substring(24)), // Convert to BigInt
            safetyDeposit: BigInt("0x" + data.substring(706, 770)),
            chainId: BigInt("0x" + data.substring(770, 834))
          };
          
          const event = {
            name: 'SrcEscrowCreated',
            args: {
              srcImmutables,
              dstImmutablesComplement
            },
            raw: log
          };
          
          // Convert to SDK format
          return this.convertToSDK(event);
        }
      }
    }
    
    return null;
  }

  convertToSDK(event) {
    if (!event || event.name !== 'SrcEscrowCreated') {
      throw new Error('Invalid event: expected SrcEscrowCreated');
    }

    const srcImmutables = event.args.srcImmutables;
    const dstImmutablesComplement = event.args.dstImmutablesComplement;

    return [
      Sdk.Immutables.new({
        orderHash: srcImmutables.orderHash,
        hashLock: Sdk.HashLock.fromString(srcImmutables.hashlock),
        maker: Sdk.Address.fromBigInt(srcImmutables.maker),
        taker: Sdk.Address.fromBigInt(srcImmutables.taker),
        token: Sdk.Address.fromBigInt(srcImmutables.token),
        amount: srcImmutables.amount,
        safetyDeposit: srcImmutables.safetyDeposit,
        timeLocks: Sdk.TimeLocks.fromBigInt(srcImmutables.timelocks),
      }),
      Sdk.DstImmutablesComplement.new({
        maker: Sdk.Address.fromBigInt(dstImmutablesComplement.maker),
        amount: dstImmutablesComplement.amount,
        token: Sdk.Address.fromBigInt(dstImmutablesComplement.token),
        safetyDeposit: dstImmutablesComplement.safetyDeposit,
        chainId: dstImmutablesComplement.chainId,
      }),
    ];
  }


  async waitForSrcEscrowCreatedEvent(txId, maxWaitTime = 10 * 60 * 1000) {
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Try to get the event
        const event = await this.getSrcEscrowCreatedEventByTxId(txId);
        
        if (event) {
          console.log(`✅ SrcEscrowCreated event found after ${Date.now() - startTime}ms`);
          return event;
        }
        
        console.log(`⏳ Waiting for transaction to be mined... (${Date.now() - startTime}ms elapsed)`);
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        
      } catch (error) {
        console.log(`⏳ Transaction not ready yet: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }
    
    throw new Error(`Timeout: Could not find SrcEscrowCreated event for transaction ${txId} after ${maxWaitTime}ms`);
  }
}

module.exports = { TronIndexer }; 