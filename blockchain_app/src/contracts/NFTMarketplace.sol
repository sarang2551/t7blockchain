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
    uint256 public listPrice = 0.01 ether;  // List price as required by the frontend

    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 price;
        uint256 maxPrice;
        bool currentlyListed;
        string name;
        string description;
    }

    mapping(uint256 => ListedToken) private idToListedToken;
    mapping(address => uint256[]) private ownerTokens; 
    mapping(address => uint256[]) private sellerTokens; 
    mapping(address => string) private whitelistedAddresses; 

    event TokenListedSuccess(
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed
    );

    event TokenDelisted(uint256 indexed tokenId, address seller);

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

    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint256 nftCount = _tokenIds.current();
        uint256 listedCount = 0;

        for (uint256 i = 1; i <= nftCount; i++) {
            if (idToListedToken[i].currentlyListed) {
                listedCount++;
            }
        }

        ListedToken[] memory tokens = new ListedToken[](listedCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= nftCount; i++) {
            if (idToListedToken[i].currentlyListed) {
                tokens[currentIndex] = idToListedToken[i];
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

            idToListedToken[newTokenId] = ListedToken(
                newTokenId,
                payable(msg.sender),
                payable(address(0)), 
                0,
                maxPrice,
                false,
                name,
                description
            );

            ownerTokens[msg.sender].push(newTokenId);
        }
    }

    function updateMaxPrice(uint256 tokenId, uint256 maxPrice) public {
        ListedToken storage token = idToListedToken[tokenId];
        require(msg.sender == token.owner, "Only the minter can update the max price.");
        require(maxPrice > 0, "Max price must be greater than zero.");
        token.maxPrice = maxPrice;
    }

    function listToken(uint256 tokenId, uint256 price) public payable nonReentrant {
        require(msg.sender == ownerOf(tokenId), "Only the owner can list the NFT.");
        require(price > 0, "Price must be greater than zero.");
        require(msg.value == listPrice, "Must pay the listing fee.");

        ListedToken storage token = idToListedToken[tokenId];
        require(!token.currentlyListed, "Token is already listed.");
        require(price <= token.maxPrice, "Price exceeds max allowed by minter.");

        _transfer(msg.sender, address(this), tokenId);

        token.currentlyListed = true;
        token.price = price;
        token.seller = payable(msg.sender);

        sellerTokens[msg.sender].push(tokenId);

        emit TokenListedSuccess(tokenId, address(this), msg.sender, price, true);
    }

    function executeSale(uint256 tokenId) public payable nonReentrant {
        ListedToken memory listedToken = idToListedToken[tokenId];
        uint256 price = listedToken.price;
        address seller = listedToken.seller;

        require(msg.value == price, "Incorrect sale price.");
        require(listedToken.currentlyListed, "Token not listed.");

        listedToken.currentlyListed = false;
        listedToken.owner = payable(msg.sender);
        listedToken.seller = payable(address(0));

        idToListedToken[tokenId] = listedToken;

        _itemsSold.increment();
        _transfer(address(this), msg.sender, tokenId);

        payable(seller).transfer(msg.value);
    }

    function delistToken(uint256 tokenId) public nonReentrant {
        ListedToken storage token = idToListedToken[tokenId];

        require(msg.sender == token.seller, "Only the seller can delist the token.");
        require(token.currentlyListed, "Token not listed.");

        token.currentlyListed = false;

        _transfer(address(this), msg.sender, tokenId);

        emit TokenDelisted(tokenId, msg.sender);
    }

    function getOwnedTokens(address _owner) public view returns (uint256[] memory) {
        return ownerTokens[_owner];
    }

    function getTokenDetails(uint256 tokenId) public view returns (ListedToken memory) {
        require(tokenId > 0 && tokenId <= _tokenIds.current(), "Invalid token ID.");
        return idToListedToken[tokenId];
    }

    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    function getWhitelistedAddresses() public view returns (address[] memory, string[] memory) {
        uint256 count = 0;

        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
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
