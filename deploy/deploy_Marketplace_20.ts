import { DeployFunction } from 'hardhat-deploy/types';

const fn: DeployFunction = async function ({ deployments: { deploy, get }, ethers: { getSigners }, network }) {
  const deployer = (await getSigners())[0];
  const tokenContract = await get('ASIX_TOKEN');
  const tokenContractAddress = network.config.chainId == 56 ? "0xc98a8EC7A07f1b743E86896a52434C4C6A0Dbc42" : tokenContract.address;

  const contractDeployed = await deploy('NFTMarketPlace', {
    from: deployer.address,
    log: true,
    skipIfAlreadyDeployed: false,
    args: [
      tokenContractAddress
    ]
  });
  console.log('npx hardhat verify --network '+ network.name +  ' ' + contractDeployed.address);

};
fn.skip = async (hre) => {
  return false;
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain != 1;
};
fn.tags = ['Marketplace'];
fn.dependencies = ['ASIX_TOKEN']
export default fn;
