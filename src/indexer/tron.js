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
        try {
          const ethersLog = {
            topics: log.topics.map(topic => '0x' + topic),
            data: '0x' + log.data
          };

          const parsedLog = this.iEscrowFactory.parseLog(ethersLog);
          if (parsedLog && parsedLog.name === 'SrcEscrowCreated') {
            const { srcImmutables, dstImmutablesComplement } = parsedLog.args;
            return this.convertToSDK(srcImmutables, dstImmutablesComplement);
          }
        } catch (e) {
          // Ignore errors in parsing logs
        }
      }
    }

    return null;
  }

  convertToSDK(srcImmutables, dstImmutablesComplement) {
    if (!srcImmutables || !dstImmutablesComplement) {
      throw new Error('Invalid event arguments for conversion');
    }

    // **FIX 2: Use Sdk.Address.fromBigInt() because the ABI type is uint256 for addresses**
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