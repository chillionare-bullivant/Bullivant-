require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: { enabled: true, runs: 1000 },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    base: {
      url: process.env.BASE_RPC_URL || process.env.RPC_URL || "https://mainnet.base.org",
      accounts: process.env.SIGNER_PRIVATE_KEY && process.env.SIGNER_PRIVATE_KEY.startsWith("0x") && process.env.SIGNER_PRIVATE_KEY.length === 66
        ? [process.env.SIGNER_PRIVATE_KEY]
        : (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.startsWith("0x") && process.env.PRIVATE_KEY.length === 66
            ? [process.env.PRIVATE_KEY]
            : []),
      chainId: 8453,
    },
  },
};
