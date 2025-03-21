require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    myQuickNode: {
      url: "https://solemn-green-leaf.matic-amoy.quiknode.pro/9119cb55e0d53f780e3ebdb9afe68d917e315e84/",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80002,
    },
  },
  solidity: "0.8.28",
};