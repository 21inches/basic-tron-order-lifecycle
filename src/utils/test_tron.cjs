const { hexToTronAddress } = require("./tron.cjs");

let hex;
let shouldBe;


console.log("------- ResolverContractAddress --------------");
shouldBe = "TSQgePiJhkeKaqjusfGUe2nRZhGm6sdP8w";
hex = "0xb4537cc40fc70b0370d255144935a05159142387";
console.log(hexToTronAddress(hex));
console.log(hexToTronAddress(hex) === shouldBe);


console.log("------- EscrowFactory --------------");
shouldBe = "THEb78FZnopZYvKpJvRcmicZLcewdmxURR";
hex = "0x4fb1926857ec058d3c6f659a376dede5bd41583f";
console.log(hexToTronAddress(hex));
console.log(hexToTronAddress(hex) === shouldBe);

console.log("------- LOP --------------");
shouldBe = "TTYA4oTNhXBhVoBAJTQmLc9fjuqJKwKLUa";
hex = "41c0b56a26ef85ac04a28101a36d260dfc29d136ae";
console.log(hexToTronAddress(hex));
console.log(hexToTronAddress(hex) === shouldBe);

console.log("------- LOP --------------");
shouldBe = "TAYjAyuKjKvkhkcvgJ7CgrJ8PVziU5vr4R";
hex = "410656e98bf5b9457048b8ac0985cb48b1b6def4ac";
console.log(hexToTronAddress(hex));
console.log(hexToTronAddress(hex) === shouldBe);