const crypto = require('crypto');

/**
 * Utility function to remove '0x' prefix from hex string
 */
function trim0x(hex) {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

/**
 * Utility function to add '0x' prefix to hex string
 */
function add0x(hex) {
  return hex.startsWith('0x') ? hex : '0x' + hex;
}

/**
 * Calculate keccak256 hash of data
 */
function keccak256(data) {
  const hash = crypto.createHash('sha256');
  hash.update(Buffer.from(trim0x(data), 'hex'));
  return '0x' + hash.digest('hex');
}

/**
 * Calculate proxy bytecode hash for implementation address
 * This matches the calcProxyBytecodeHash method from EscrowFactory
 */
function calcProxyBytecodeHash(implementationAddress) {
  const proxyBytecode = `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${trim0x(implementationAddress)}5af43d82803e903d91602b57fd5bf3`;
  return keccak256(proxyBytecode);
}

/**
 * Calculate CREATE2 address for Tron (using 0x41 prefix instead of 0xff)
 *
 * @param {string} factoryAddress - The EscrowFactory address
 * @param {string} immutablesHash - The hash from srcImmutables.hash()
 * @param {string} implementationAddress - The escrow implementation address
 * @returns {string} The calculated CREATE2 address for Tron
 */
function getTronCreate2Address(factoryAddress, immutablesHash, implementationAddress) {
  console.log(factoryAddress, immutablesHash, implementationAddress);

  // Remove 0x prefixes for calculations
  const factoryAddr = trim0x(factoryAddress);
  const salt = trim0x(immutablesHash);
  const initCodeHash = trim0x(calcProxyBytecodeHash(implementationAddress));

  // Create the data to hash: 0x41 + factory address (padded to 32 bytes) + salt + init code hash
  const data = '41' + factoryAddr.padStart(64, '0') + salt.padStart(64, '0') + initCodeHash.padStart(64, '0');

  // Calculate keccak256 hash
  const hash = keccak256(data);

  // Take the last 20 bytes (40 hex characters) and add 0x41 prefix for Tron
  const addressBytes = hash.slice(-40);
  const tronAddress = '41' + addressBytes;

  return tronAddress;
}

// Export the function for use in other modules
module.exports = {
  getTronCreate2Address,
};
