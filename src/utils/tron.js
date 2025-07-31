/**
 * TRON utility functions
 */

/**
 * Converts a TRON address to hex format
 * @param {string} tronAddress - The TRON address to convert
 * @returns {string} The hex representation of the address
 */
export function tronAddressToHex(tronAddress) {
  if (!tronAddress) {
    throw new Error("TRON address is required");
  }

  // If it's already in hex format, return as is
  if (tronAddress.startsWith('0x')) {
    return tronAddress;
  }

  // If it's a TRON address (starts with 'T'), convert to hex
  if (tronAddress.startsWith('T')) {
    // This is a simplified conversion - you may need a proper TRON address converter
    // For now, we'll return the address as is and let the SDK handle it
    // TODO: Implement proper TRON address to hex conversion
    return tronAddress;
  }

  return tronAddress;
}

/**
 * Validates if an address is a valid TRON address
 * @param {string} address - The address to validate
 * @returns {boolean} True if valid TRON address
 */
export function isValidTronAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // TRON addresses start with 'T' and are 34 characters long
  if (address.startsWith('T') && address.length === 34) {
    return true;
  }

  // Hex addresses should be 42 characters long (including 0x)
  if (address.startsWith('0x') && address.length === 42) {
    return true;
  }

  return false;
}

/**
 * Gets the appropriate chain ID for TRON networks
 * @param {string} network - Network name ('mainnet' or 'nile')
 * @returns {number} Chain ID
 */
export function getTronChainId(network = 'nile') {
  const chainIds = {
    mainnet: 728126428,
    nile: 3448148188,
  };

  return chainIds[network.toLowerCase()] || chainIds.nile;
} 