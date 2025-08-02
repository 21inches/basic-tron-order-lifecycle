/**
 * TRON utility functions
 */

const {TronWeb} = require('tronweb');
const _tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
});

/**
 * Converts a TRON address to hex format
 * @param {string} tronAddress - The TRON address to convert
 * @returns {string} The hex representation of the address
 */
function tronAddressToHex(tronAddress) {
  if (!tronAddress) {
    throw new Error("TRON address is required");
  }

  // If it's already in hex format, return as is
  if (tronAddress.startsWith('0x')) {
    return tronAddress;
  }

  if (!_tronWeb.isAddress(tronAddress)) {
    throw new Error('Invalid Tron Base58 address provided.');
  }

  const hex = _tronWeb.address.toHex(tronAddress);
  return `0x${hex.slice(2)}`; // Remove '41' prefix and add 0x prefix
}

function removePrefix(hexStr) {
  hexStr = hexStr.toLowerCase();

  if (hexStr.startsWith("0x")) {
    // Check if it's a valid Ethereum address (40 hex characters after '0x')
    if (/^0x[a-f0-9]{40}$/.test(hexStr)) {
      return hexStr;
    } else {
      throw new Error("Invalid Ethereum address format");
    }
  } else if (hexStr.startsWith("41")) {
    // Check if it's a valid Tron address (42 hex characters starting with '41')
    if (/^41[a-f0-9]{40}$/.test(hexStr)) {
      return "0x" + hexStr.slice(2);
    } else {
      throw new Error("Invalid Tron address format");
    }
  } else {
    throw new Error("Unrecognized address format");
  }
}

function hexToTronAddress(hexAddress) {
  if (!hexAddress) {
    throw new Error("Hex address is required");
  }

  return _tronWeb.address.fromHex(hexAddress);
}

/**
 * Validates if an address is a valid Base54 TRON address
 * @param {string} address - The address to validate
 * @returns {boolean} True if valid Base54 TRON address
 */
function isValidBase58TronAddress(address) {
    return typeof address === 'string' && TronWeb.isAddress(address);
}

  
/**
 * Gets the appropriate chain ID for TRON networks
 * @param {string} network - Network name ('mainnet' or 'nile')
 * @returns {number} Chain ID
 */
function getTronChainId(network = 'nile') {
  const chainIds = {
    mainnet: 728126428,
    nile: 3448148188,
  };

  return chainIds[network.toLowerCase()] || chainIds.nile;
} 

module.exports = { 
  tronAddressToHex,
  hexToTronAddress,
  isValidBase58TronAddress,
  getTronChainId,
  removePrefix
 };