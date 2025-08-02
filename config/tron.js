import dotenv from "dotenv";
dotenv.config();

export const config = {
    // [TRON] Swap Source Network Configuration
    src: {
        LOP: "0x0656e98bf5b9457048b8ac0985cb48b1b6def4ac", // "TAYjAyuKjKvkhkcvgJ7CgrJ8PVziU5vr4R",
        EscrowFactory: "0x527eb6a0f425c77722da1d92aa515f691606571b", // "THVQCzNgJxTvBRH297tmHXuxVdcahipy3f",
        ResolverContractAddress: "0x9afd02fe7b017867e7468a0cacb3546c721edd84", // "TQ6iAAL9oV4Xh6DrQwZ8iGa7q1QAcwhpui",
        USDT: "0xeca9bc828a3005b9a3b909f2cc5c2a54794de05f", //"TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf",
        EscrowSrcImplementationAddress: "0x810deb8c21a11f0f10977378d403c995480c2b8c", // "TMjaqzSMeni2H8qSG2JyShS29dY8zgcm3V",
        EscrowDstImplementationAddress: "0x724132e32346b5199e7821025bcae3a20c5717fb", // "TLPL921VcESVS3YKB1KnPxNmBENxTDB3jY",
        TrueERC20: "0xf8dfdf1ab75de04f485a9871d9298a070b9bebc6", // "TYf8mVp2tC7K9AYbFFfv8gVH82JEkbKKDj",
        ChainId: 3448148188, // NILE=3448148188,  Mainnet=728126428
        UserPrivateKey: process.env.TRON_SRC_USER_PRIVATE_KEY,
        RpcUrl: "https://nile.trongrid.io",
        ResolverPrivateKey: process.env.TRON_SRC_RESOLVER_PRIVATE_KEY,
    },
    // [] Swap Destination Network Configuration
    dst: {
        LOP: "0x32a209c3736c5bd52e395eabc86b9bca4f602985",
        EscrowFactory: "0x61a32a9263c6ff568c66799a94f8fe09c1db7a66",
        ResolverContractAddress: "0xe002e8e986fd4bbff58b49423c7f7e0e0e92cc59",
        BLT: "0x0BF8E91b08b242cD7380bC92385C90c8270b37f0",
        EscrowSrcImplementationAddress: "0xa17ddb01f03a42e0070a0e25099cf3d27b705fff",
        EscrowDstImplementationAddress: "0x7490329e69ab8e298a32dc59493034e4d02a5ccf",
        TrueERC20: "0x6dFe5DA3C989aB142CfB16a8FfA2B0e640b1d821",
        ChainId: 11155111,
        UserPrivateKey: process.env.SEPOLIA_DST_USER_PRIVATE_KEY,
        RpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
        ResolverPrivateKey: process.env.SEPOLIA_DST_RESOLVER_PRIVATE_KEY,
    }
};
