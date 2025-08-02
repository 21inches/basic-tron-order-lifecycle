const dotenv = require("dotenv");
dotenv.config();

const { TronWeb } = require("tronweb");
const { TronIndexer } = require('./src/indexer/tron.cjs');
const {config} = require("./config/tron");

// Use Nile testnet
const tronWeb = new TronWeb({
  fullHost: config.src.RpcUrl,
  headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
});

const txHash = 'f8d15c4193d455cf437e67fa1c6a159f750f501e6eaeab9f163a4eb638452b9d'

const tronIndexer = new TronIndexer(tronWeb);
tronIndexer.getSrcEscrowCreatedEvent(txHash).then(console.log);