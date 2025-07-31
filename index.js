import { TronWeb, utils as TronWebUtils, Trx, TransactionBuilder, Contract, Event, Plugin } from 'tronweb';
import { readFileSync } from 'fs';

// === CONFIGURATION ===
const privateKey = 'b95c19016728b6aa770fc4111a7ac0abc6cd252dba16bdbb58c679edddbd125a';
const contractAddress = 'TWS19imF8BnFKtB5Cm78w7s1nDdRtyZrsP';
const TRONGRID_API_KEY='6f0ba0b2-b2c4-4892-abab-017dfd781a74'

// Load the ABI
const abiData = JSON.parse(readFileSync('./Resolver.json', 'utf8'));
const contractABI = abiData.abi;

// Use Nile testnet
const tronWeb = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
  headers: { "TRON-PRO-API-KEY": TRONGRID_API_KEY },
  privateKey: privateKey
});

async function getContractBalance() {
    // Load contract with ABI and call getBlockTimestamp
    try {
      const contract = await tronWeb.contract(contractABI, contractAddress);
      console.log('Contract loaded successfully with ABI');
      
      // Call getBlockTimestamp function
      const blockTimestamp = await contract.getBlockTimestamp().call();
      console.log(`Block Timestamp: ${blockTimestamp}`);
      
      // Also call getBalance function from the contract
      const contractBalance = await contract.getBalance().call();
      console.log(`Contract Balance (from contract): ${contractBalance}`);
      
    } catch (contractErr) {
      console.log('Error calling contract functions:', contractErr.message);
    }
}

getContractBalance();