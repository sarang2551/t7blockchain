// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ERC721URIStorage, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    address payable contractOwner;

    struct NFTInfo {
        uint256 tokenId;
        address payable minter;
        address payable seller; // The user who listed the NFT for sale
        uint256 price;
        uint256 maxPrice;
        bool currentlyListed;
        string name;
        string description;
    }

    mapping(uint256 => NFTInfo) private idToNFTInfo;
    mapping(address => uint256[]) private ownerTokens; 
    mapping(address => uint256[]) private minterTokens;  
    mapping(address => string) private whitelistedAddresses; 

    event TokenListedSuccess(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        bool currentlyListed
    );

    event TokenDelisted(uint256 indexed tokenId, address indexed seller);

    modifier onlyOwner() {
        require(contractOwner == msg.sender, "Only the contract owner can perform this action.");
        _;
    }

    constructor() ERC721("NFTMarketplace", "NFTM") {
        contractOwner = payable(msg.sender);
    }

    function owner() public view returns (address) {
        return contractOwner;
    }

    function getAllNFTs() public view returns (NFTInfo[] memory) {
        uint256 nftCount = _tokenIds.current();
        uint256 listedCount = 0;

        for (uint256 i = 1; i <= nftCount; i++) {
            if (idToNFTInfo[i].currentlyListed) {
                listedCount++;
            }
        }

        NFTInfo[] memory tokens = new NFTInfo[](listedCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= nftCount; i++) {
            if (idToNFTInfo[i].currentlyListed) {
                tokens[currentIndex] = idToNFTInfo[i];
                currentIndex++;
            }
        }

        return tokens;
    }

    function whitelistAddress(address _address, string memory _label) public onlyOwner {
        whitelistedAddresses[_address] = _label;
    }

    function unwhitelistAddress(address _address) public onlyOwner {
        delete whitelistedAddresses[_address];
    }

    function isWhitelisted(address _address) public view returns (bool) {
        return bytes(whitelistedAddresses[_address]).length > 0;
    }

    function mintBatch(
        string memory tokenURI,
        uint256 maxPrice,
        string memory name,
        string memory description,
        uint256 quantity
    ) public {
        require(isWhitelisted(msg.sender), "Address not whitelisted for minting.");
        require(maxPrice > 0, "Max price must be greater than zero");
        require(quantity > 0, "Quantity must be greater than zero");

        for (uint256 i = 0; i < quantity; i++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();

            _safeMint(msg.sender, newTokenId);
            _setTokenURI(newTokenId, tokenURI);

            idToNFTInfo[newTokenId] = NFTInfo(
                newTokenId,
                payable(msg.sender),  // minter
                payable(address(0)),  // seller is set at listing time, not now
                0,                    // price set at listing
                maxPrice,
                false,
                name,
                description
            );

            ownerTokens[msg.sender].push(newTokenId);
            minterTokens[msg.sender].push(newTokenId); // Track minted token
        }
    }

    function updateMaxPrice(uint256 tokenId, uint256 maxPrice) public {
        NFTInfo storage token = idToNFTInfo[tokenId];
        require(msg.sender == token.minter, "Only the minter can update the max price.");
        require(maxPrice > 0, "Max price must be greater than zero.");
        token.maxPrice = maxPrice;
    }

    function listToken(uint256 tokenId, uint256 price) public nonReentrant {
        require(msg.sender == ownerOf(tokenId), "Only the owner can list the NFT.");
        require(price > 0, "Price must be greater than zero.");

        NFTInfo storage token = idToNFTInfo[tokenId];
        require(!token.currentlyListed, "Token is already listed.");
        require(price <= token.maxPrice, "Price exceeds max allowed by minter.");

        // Transfer NFT to the contract (marketplace)
        _transfer(msg.sender, address(this), tokenId);

        token.currentlyListed = true;
        token.price = price;
        token.seller = payable(msg.sender); // Record the seller at the time of listing

        emit TokenListedSuccess(tokenId, msg.sender, price, true);
    }

    function executeSale(uint256 tokenId) public payable nonReentrant {
        NFTInfo memory tokenInfo = idToNFTInfo[tokenId];
        uint256 price = tokenInfo.price;

        require(msg.value == price, "Incorrect sale price.");
        require(tokenInfo.currentlyListed, "Token not listed.");

        address payable seller = tokenInfo.seller;
        address prevOwner = ownerOf(tokenId);

        // Transfer NFT from contract to buyer
        _transfer(address(this), msg.sender, tokenId);

        // Update struct: listing is done, reset price and seller
        NFTInfo storage updatedToken = idToNFTInfo[tokenId];
        updatedToken.currentlyListed = false;
        updatedToken.price = 0;
        updatedToken.seller = payable(address(0));

        // Update ownerTokens: Add to buyer
        ownerTokens[msg.sender].push(tokenId);

        // Remove tokenId from previous owner's tokens
        uint256[] storage prevOwnerTokens = ownerTokens[prevOwner];
        for (uint256 i = 0; i < prevOwnerTokens.length; i++) {
            if (prevOwnerTokens[i] == tokenId) {
                prevOwnerTokens[i] = prevOwnerTokens[prevOwnerTokens.length - 1];
                prevOwnerTokens.pop();
                break;
            }
        }

        _itemsSold.increment();

        // Pay the original seller
        seller.transfer(msg.value);
    }

    function delistToken(uint256 tokenId) public nonReentrant {
        NFTInfo storage token = idToNFTInfo[tokenId];

        require(token.currentlyListed, "Token not listed.");
        require(msg.sender == token.seller, "Only the seller can delist the token.");

        token.currentlyListed = false;

        // Transfer NFT back to seller (original lister)
        _transfer(address(this), token.seller, tokenId);

        // Reset seller after delisting
        token.seller = payable(address(0));

        emit TokenDelisted(tokenId, msg.sender);
    }

    function getOwnedTokens(address _owner) public view returns (uint256[] memory) {
        return ownerTokens[_owner];
    }

    function getMintedTokens(address _minter) public view returns (uint256[] memory) {
        return minterTokens[_minter];
    }

    function getTokenDetails(uint256 tokenId) public view returns (NFTInfo memory) {
        require(tokenId > 0 && tokenId <= _tokenIds.current(), "Invalid token ID.");
        return idToNFTInfo[tokenId];
    }

    function getWhitelistedAddresses() public view returns (address[] memory, string[] memory) {
        uint256 nftCount = _tokenIds.current();
        uint256 count = 0;

        for (uint256 i = 1; i <= nftCount; i++) {
            address addr = ownerOf(i);
            if (bytes(whitelistedAddresses[addr]).length > 0) {
                count++;
            }
        }

        address[] memory addresses = new address[](count);
        string[] memory labels = new string[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            address addr = ownerOf(i);
            if (bytes(whitelistedAddresses[addr]).length > 0) {
                addresses[index] = addr;
                labels[index] = whitelistedAddresses[addr];
                index++;
            }
        }
        return (addresses, labels);
    }
}
