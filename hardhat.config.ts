import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-deploy";
import { utils } from 'ethers';

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function node(networkName: string) {
  const fallback = 'http://localhost:8545';
  const uppercase = networkName.toUpperCase();
  const uri = process.env[`NODE_${uppercase}`] || fallback;
  console.log('uri: ', uri)
  return uri.replace('{{NETWORK}}', networkName);
}

function accounts(networkName: string) {
  const uppercase = networkName.toUpperCase();
  const accounts = process.env[`ACCOUNTS_${uppercase}`] || '';
  return accounts
    .split(',')
    .map((account) => account.trim())
    .filter(Boolean);
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
interface CustomUserConfig extends HardhatUserConfig {
  namedAccounts: any,
  bscscan: {
    apiKey: string | undefined
  }
}

const config: CustomUserConfig = {
  solidity: {
    compilers: [
      {
        version: "^0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "^0.4.22",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
    ]
  },
  namedAccounts: {
    deployer: 0,
    other: 1
  },
  defaultNetwork: "hardhat",

  networks: {
    hardhat: {
      // hardfork: 'istanbul',
      accounts: {
        accountsBalance: utils.parseUnits('1', 36).toString(),
        count: 5,
      },
      forking: {
        url: node('mainnet'), // May 31, 2021
      },
    },
    mainnet: {
      hardfork: 'istanbul',
      accounts: accounts('mainnet'),
      url: node('mainnet'),
    },
    testnet: {
      url: process.env.TESTNET_URL || "",
      accounts: accounts('testnet'),
      gas: 9500000,
      gasPrice: 1000000
    },
    bsctestnet: {
      url: process.env.BSCTESTNET_URL || "",
      accounts: [process.env.ACCOUNTS_BSCTESTNET || ""]
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  bscscan: {
    apiKey: process.env.BSCSCAN_API_KEY
  }
};

export default config;
