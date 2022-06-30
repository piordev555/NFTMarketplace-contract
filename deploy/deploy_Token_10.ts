import { DeployFunction } from 'hardhat-deploy/types';

const fn: DeployFunction = async function ({ deployments: { deploy }, ethers: { getSigners }, network }) {
  const deployer = (await getSigners())[0];
  const contractDeployed = await deploy('ASIX_TOKEN', {
    from: deployer.address,
    log: true,
    skipIfAlreadyDeployed: true,
    args: []
  });
  console.log('npx hardhat verify --network '+ network.name +  ' ' + contractDeployed.address);

};
fn.skip = async (hre) => {
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain == 1 || chain == 56;
};
fn.tags = ['ASIX_TOKEN'];

export default fn;
