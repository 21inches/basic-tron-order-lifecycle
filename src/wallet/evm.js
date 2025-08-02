const { Wallet: PKWallet } = require("ethers");

class EVMWallet {
  provider;
  signer;

  constructor(privateKeyOrSigner, provider) {
    this.provider = provider;
    this.signer =
      typeof privateKeyOrSigner === "string"
        ? new PKWallet(privateKeyOrSigner, this.provider)
        : privateKeyOrSigner;
  }

  async signOrder(srcChainId, order, LOPAddress) {
    const typedData = order.getTypedData(srcChainId);
    const domain = {
      name: "1inch Limit Order Protocol",
      version: "4",
      chainId: srcChainId,
      verifyingContract: LOPAddress,
    };

    return this.signer.signTypedData(
      domain,
      { Order: typedData.types[typedData.primaryType] },
      typedData.message
    );
  }
}

module.exports = { EVMWallet };
