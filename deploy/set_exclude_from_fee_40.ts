import { DeployFunction } from 'hardhat-deploy/types';

const fn: DeployFunction = async function ({ deployments: { deploy, get, execute }, ethers: { getSigners }, network }) {
  const deployer = (await getSigners())[0];
  const marketplaceContract = await get('NFTMarketPlace');

  execute(
    'ASIX_TOKEN',
    {from: deployer.address, log: true},
    'excludeFromFee',
    marketplaceContract.address
  )

  console.log('Exclude marketplace contract address from fee in ASIX token.');

};
fn.skip = async (hre) => {
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain == 1 || chain == 56;
};
fn.dependencies = ['ASIX_TOKEN', 'Marketplace'];

export default fn;
