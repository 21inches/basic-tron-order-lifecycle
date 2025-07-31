import { TronWeb, utils as TronWebUtils, Trx, TransactionBuilder, Contract, Event, Plugin } from 'tronweb';

// === CONFIGURATION ===
const privateKey = 'b95c19016728b6aa770fc4111a7ac0abc6cd252dba16bdbb58c679edddbd125a';
const contractAddress = 'TWS19imF8BnFKtB5Cm78w7s1nDdRtyZrsP';
const TRONGRID_API_KEY='6f0ba0b2-b2c4-4892-abab-017dfd781a74'

// Use Nile testnet
const tronWeb = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
  headers: { "TRON-PRO-API-KEY": TRONGRID_API_KEY },
  privateKey: privateKey
});

async function getContractBalance() {
  try {
    const contract = await tronWeb.contract().at(contractAddress);
    const balanceSun = await contract.getBalance().call();
    const balanceTRX = tronWeb.fromSun(balanceSun.toString());
    console.log(`Contract Balance: ${balanceTRX} TRX`);
  } catch (err) {
    console.error('Error calling contract:', err);
  }
}

getContractBalance();