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
    // [BASE] Swap Destination Network Configuration
    dst: {
        LOP: "0xe30f9abbadc1eb84b41d41035b2a2c7d0bd5f9b2",
        EscrowFactory: "0x178ddaca4499a89e40826ec247baf608051edf9e",
        ResolverContractAddress: "0x3fe279B56F330304446522F04907fBBe03Fe236a",
        BLT: "0xbb7f72d58f5F7147CBa030Ba4c46a94a07E4c2CA",
        EscrowSrcImplementationAddress: "0xe55061a78bf30e7f38410b90a6a167d5621cc068",
        EscrowDstImplementationAddress: "0x0418b6e80a602474fbfadc3a2594413fe68496bb",
        TrueERC20: "0x8bD9f7C82eBF9D9C830a76bAcb0E99A52163B304",
        ChainId: 84532,
        UserPrivateKey: process.env.BASE_DST_USER_PRIVATE_KEY,
        RpcUrl: "https://base-sepolia.drpc.org",
        ResolverPrivateKey: process.env.BASE_DST_RESOLVER_PRIVATE_KEY,
    },
};
