require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",  // your main contracts
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.26",  // your main contracts
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat_1: {
      url: "http://localhost:8545",
      chainId: 31337,
      allowUnlimitedContractSize: true,
      initialBaseFeePerGas: 0,
    },
  },
};
