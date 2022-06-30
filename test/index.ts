import { expect } from "chai";
import { ethers, getNamedAccounts } from "hardhat";
import {Contract, ContractReceipt} from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Result } from "ethers/lib/utils";

let tokenContract: Contract;
let marketplaceContract: Contract;
let nftContract: Contract;
let signer: SignerWithAddress;
let buyer: SignerWithAddress;

const nftTokenURL = "https://gateway.ipfs.io/QWESsfseSfeSXfesSXCF/1";
const marketingFee = 10000 * 10 ** 9;

describe("NFT marketplace Test", function () {
  before(async () => {
    const {deployer, other} = await getNamedAccounts();
    signer = await ethers.getSigner(deployer);
    buyer = await ethers.getSigner(other);

    const tokenContractFactory = await ethers.getContractFactory('ASIX_TOKEN');
    const marketplaceContractFactory = await ethers.getContractFactory('NFTMarketPlace');
    const nftContractFactory = await ethers.getContractFactory('NFT');

    tokenContractFactory.connect(signer);
    marketplaceContractFactory.connect(signer);
    nftContractFactory.connect(signer);

    tokenContract = await tokenContractFactory.deploy();
    marketplaceContract = await marketplaceContractFactory.deploy(tokenContract.address);
    nftContract = await nftContractFactory.deploy(marketplaceContract.address);
    
    console.log('contract deployed from: ', signer.address);
    console.log('contract deployed: ', tokenContract.address, marketplaceContract.address, nftContract.address);
  });

  it("NFT mareketplace address in NFT contract", async function () {

    const marketplaceContractAddress = await nftContract.getMarketplaceContract();

    expect(marketplaceContractAddress).to.equal(marketplaceContract.address);
  });

  it ("NFT minting", async() => {
    let createNFTTx = await nftContract.createNFTToken(nftTokenURL);
    await createNFTTx.wait();
    let tokenUri = await nftContract.tokenURI(1);
    expect(tokenUri).to.equal(nftTokenURL);
  });

  it("Create Item For Sale with Token - Not enough allowance ", async () => {
    //Mint NFT
    let createNFTTx = await nftContract.createNFTToken(nftTokenURL);
    await createNFTTx.wait();

    const price = 1000 * 10 ** 9;
    await expect(
      marketplaceContract.createItemForSaleWithToken(nftContract.address, 1, price)
    ).to.be.revertedWith("Not enough allowance");
  });

  it("Create Item For Sale with Token", async () => {
    //Mint NFT
    let createNFTTx = await nftContract.createNFTToken(nftTokenURL);
    await createNFTTx.wait();

    let approveTx = await tokenContract.approve(marketplaceContract.address, marketingFee);
    await approveTx.wait();
    
    const price = 100000 * 10 ** 9;
    let tx = await marketplaceContract.createItemForSaleWithToken(nftContract.address, 1, price);
    await tx.wait();
  });

  it("Create Market For Sale with Token: Should be fail Not enough allownce: ", async () => {
    //Mint NFT
    let createNFTTx = await nftContract.createNFTToken(nftTokenURL);
    await createNFTTx.wait();

    //creat item for sale with token
    let approveTx = await tokenContract.approve(marketplaceContract.address, marketingFee);
    await approveTx.wait();
    
    const price = 100000 * 10 ** 9;
    let tx = await marketplaceContract.createItemForSaleWithToken(nftContract.address, 2, price);
    await tx.wait();

    // buy
    await expect(
      marketplaceContract.connect(buyer).createMarketForSaleWithToken(nftContract.address, 2)
    ).to.be.revertedWith("Not enough allowance");
  });

  it("Create Market For Sale with Token: Should be fail under price: ", async () => {
    //Mint NFT
    let createNFTTx = await nftContract.createNFTToken(nftTokenURL);
    await createNFTTx.wait();

    //creat item for sale with token
    let approveTx = await tokenContract.approve(marketplaceContract.address, marketingFee);
    await approveTx.wait();
    
    const price = 100000 * 10 ** 9;
    let tx = await marketplaceContract.createItemForSaleWithToken(nftContract.address, 3, price);
    await tx.wait();

    const lowPrice = 1000 * 10 ** 9;
    //approve 
    tokenContract.connect(buyer).approve(marketplaceContract.address, lowPrice)
    
    //buy
    await expect(
      marketplaceContract.connect(buyer).createMarketForSaleWithToken(nftContract.address, 3)
    ).to.be.revertedWith("Not enough allowance");
  });

  it("Create Market For Sale with Token:", async () => {
    //Mint NFT
    let createNFTTx = await nftContract.createNFTToken(nftTokenURL);
    await createNFTTx.wait();

    //creat item for sale with token
    let approveTx = await tokenContract.approve(marketplaceContract.address, marketingFee);
    await approveTx.wait();
    
    const price = 100000 * 10 ** 9;
    let tx = await marketplaceContract.createItemForSaleWithToken(nftContract.address, 4, price);
    await tx.wait();

    //approve 
    let transferTx = await tokenContract.transfer(buyer.address, 2 * price);
    await transferTx.wait();
    let approveBuyTx = await  tokenContract.connect(buyer).approve(marketplaceContract.address, price)
    await approveBuyTx.wait();
    //buy
    let buyTx = await marketplaceContract.connect(buyer).createMarketForSaleWithToken(nftContract.address, 4);
    await buyTx.wait();

  });


});


