import { DeployFunction } from 'hardhat-deploy/types';

const fn: DeployFunction = async function ({ deployments: { deploy, get }, ethers: { getSigners }, network }) {
  const deployer = (await getSigners())[0];
  const marketPlaceContract = await get('NFTMarketPlace');

  const contractDeployed = await deploy('NFT', {
    from: deployer.address,
    log: true,
    skipIfAlreadyDeployed: false,
    args: [
      marketPlaceContract.address
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
fn.tags = ['NFT'];
fn.dependencies = ['ASIX_TOKEN', 'Marketplace']
export default fn;
