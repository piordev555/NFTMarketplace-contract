// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract NFTMarketPlace is ReentrancyGuard {
    uint256 marketFeesForEth = 0.010 ether;
    uint256 marketFeesForToken = 10_000 * 10 ** 9; //10000 token
    address payable owner;
    address paymentTokenAddress;

    using Counters for Counters.Counter;
    Counters.Counter private itemId;
    Counters.Counter private itemsSold;

    constructor(address _paymentToken) {
        owner = payable(msg.sender);
        paymentTokenAddress = _paymentToken;
    }

    struct NftMerketItem {
        address nftContract;
        uint256 id;
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 price;
        bool sold;
        address paymentTokenAddress;
        uint256 marketingFeeTokenAmount;
    }

    event NftMerketItemCreated(
        address indexed nftContract,
        uint256 indexed id,
        uint256 tokenId,
        address owner,
        address seller,
        uint256 price,
        bool sold,
        address indexed paymentTokenAddress
    );

    function gettheMarketFeesForEth() public view returns (uint256) {
        return marketFeesForEth;
    }

    function gettheMarketFeesForToken() public view returns (uint256) {
        return marketFeesForToken;
    }

    ///////////////////////////////////
    mapping(uint256 => NftMerketItem) private idForMarketItem;

    ///////////////////////////////////
    function createItemForSaleWithEth(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price should be moreThan 1");
        require(tokenId > 0, "token Id should be moreThan 1");
        require(msg.value == marketFeesForEth, "The Market Fees is 0.010 Ether");
        require(nftContract != address(0), "address should not be equal 0x0");
        itemId.increment();
        uint256 id = itemId.current();

        idForMarketItem[id] = NftMerketItem({
            nftContract: nftContract,
            id: id,
            tokenId: tokenId,
            owner: payable(address(0)),
            seller: payable(msg.sender), // this is for seller address, should be seller: payable(msg.sender)
            price: price,
            sold: false,
            paymentTokenAddress: address(0),
            marketingFeeTokenAmount: 0
        }
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit NftMerketItemCreated(
            nftContract,
            id,
            tokenId,
            address(0),
            msg.sender,
            price,
            false,
            address(0)
        );
    }

    function createItemForSaleWithToken(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price should be moreThan 1");
        require(tokenId > 0, "token Id should be moreThan 1");
        require(
            IERC20(paymentTokenAddress).allowance(msg.sender, address(this)) >=
                marketFeesForToken,
            "Not enough allowance"
        );
        require(nftContract != address(0), "address should not be equal 0x0");
        itemId.increment();
        uint256 id = itemId.current();

        uint256 currentTokenBalance = IERC20(paymentTokenAddress).balanceOf(address(this));

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        IERC20(paymentTokenAddress).transferFrom(msg.sender, address(this), marketFeesForToken);

        uint256 marketingFeeTokenAmount = IERC20(paymentTokenAddress).balanceOf(address(this)) - currentTokenBalance;

        idForMarketItem[id] = NftMerketItem({
            nftContract: nftContract,
            id: id,
            tokenId: tokenId,
            owner: payable(address(0)),
            seller: payable(msg.sender), // this is for seller address, should be seller: payable(msg.sender)
            price: price,
            sold: false,
            paymentTokenAddress: paymentTokenAddress,
            marketingFeeTokenAmount: marketingFeeTokenAmount
        }
        );
        
        emit NftMerketItemCreated(
            nftContract,
            id,
            tokenId,
            address(0),
            msg.sender,
            price,
            false,
            paymentTokenAddress
        );
    }

    //Create Maket

    function createMarketForSaleWithEth(address nftContract, uint256 nftItemId)
        public
        payable
        nonReentrant
    {
        uint256 price = idForMarketItem[nftItemId].price;
        uint256 tokenId = idForMarketItem[nftItemId].tokenId;

        require(msg.value == price, "should buy the price of item");
        idForMarketItem[nftItemId].seller.transfer(msg.value);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId); //buy
        idForMarketItem[nftItemId].owner = payable(msg.sender);
        idForMarketItem[nftItemId].sold = true;
        itemsSold.increment();
        payable(owner).transfer(marketFeesForEth);
    }

      function createMarketForSaleWithToken(address nftContract, uint256 nftItemId)
        public
        nonReentrant
    {
        uint256 price = idForMarketItem[nftItemId].price;
        uint256 tokenId = idForMarketItem[nftItemId].tokenId;
        require(
            IERC20(paymentTokenAddress).allowance(msg.sender, address(this)) >=
                price,
            "Not enough allowance"
        );
        IERC20(paymentTokenAddress).transferFrom(msg.sender, idForMarketItem[nftItemId].seller, price);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId); //buy
        idForMarketItem[nftItemId].owner = payable(msg.sender);
        idForMarketItem[nftItemId].sold = true;
        itemsSold.increment();
        IERC20(paymentTokenAddress).transfer(owner, idForMarketItem[nftItemId].marketingFeeTokenAmount);
    }

    //My items => sold,not sold,buy

    function getMyItemCreated() public view returns (NftMerketItem[] memory) {
        uint256 totalItemCount = itemId.current();
        uint256 myItemCount = 0; //10
        uint256 myCurrentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idForMarketItem[i + 1].seller == msg.sender) {
                myItemCount += 1;
            }
        }
        NftMerketItem[] memory nftItems = new NftMerketItem[](myItemCount); //list[3]
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idForMarketItem[i + 1].seller == msg.sender) {
                //[1,2,3,4,5]
                uint256 currentId = i + 1;
                NftMerketItem storage currentItem = idForMarketItem[currentId];
                nftItems[myCurrentIndex] = currentItem;
                myCurrentIndex += 1;
            }
        }

        return nftItems;
    }

    //Create My purchased Nft Item

    function getMyNFTPurchased() public view returns (NftMerketItem[] memory) {
        uint256 totalItemCount = itemId.current();
        uint256 myItemCount = 0; //10
        uint256 myCurrentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idForMarketItem[i + 1].owner == msg.sender) {
                myItemCount += 1;
            }
        }

        NftMerketItem[] memory nftItems = new NftMerketItem[](myItemCount); //list[3]
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idForMarketItem[i + 1].owner == msg.sender) {
                //[1,2,3,4,5]
                uint256 currentId = i + 1;
                NftMerketItem storage currentItem = idForMarketItem[currentId];
                nftItems[myCurrentIndex] = currentItem;
                myCurrentIndex += 1;
            }
        }

        return nftItems;
    }

    //Fetch  all unsold nft items
    function getAllUnsoldItems() public view returns (NftMerketItem[] memory) {
        uint256 totalItemCount = itemId.current();
        uint256 myItemCount = itemId.current() - itemsSold.current();
        uint256 myCurrentIndex = 0;

        NftMerketItem[] memory nftItems = new NftMerketItem[](myItemCount); //list[3]
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idForMarketItem[i + 1].owner == address(0)) {
                //[1,2,3,4,5]
                uint256 currentId = i + 1;
                NftMerketItem storage currentItem = idForMarketItem[currentId];
                nftItems[myCurrentIndex] = currentItem;
                myCurrentIndex += 1;
            }
        }

        return nftItems;
    }
}
