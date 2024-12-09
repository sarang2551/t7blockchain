// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ERC721URIStorage, ReentrancyGuard {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    address payable owner;

    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 price;
        bool currentlyListed;
        string name;
        string description;
    }

    mapping(uint256 => ListedToken) private idToListedToken;
    mapping(address => uint256[]) private ownerTokens; // Tracks token ownership by address
    mapping(address => uint256[]) private sellerTokens; // Tracks tokens listed for sale by address

    event TokenListedSuccess(
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed
    );

    event TokenDelisted(uint256 indexed tokenId, address seller);
    event TokenBought(uint256 indexed tokenId);

    constructor() ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
    }

    function mintBatch(
        string memory tokenURI,
        uint256 price,
        string memory name,
        string memory description,
        uint256 quantity
    ) public {
        require(price > 0, "Price must be greater than zero");
        require(quantity > 0, "Quantity must be greater than zero");

        for (uint256 i = 0; i < quantity; i++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();

            _safeMint(msg.sender, newTokenId);
            _setTokenURI(newTokenId, tokenURI);

            // Add metadata for each token
            idToListedToken[newTokenId] = ListedToken(
                newTokenId,
                payable(msg.sender),
                payable(address(0)), // No seller yet
                price,
                false,
                name,
                description
            );

            ownerTokens[msg.sender].push(newTokenId);
        }
    }


    function listToken(uint256 tokenId, uint256 price) public payable nonReentrant {
        require(msg.sender == ownerOf(tokenId), "Only the owner can list the NFT");
        require(price > 0, "Price must be greater than zero");

        ListedToken storage token = idToListedToken[tokenId];
        require(!token.currentlyListed, "Token is already listed.");

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

        require(msg.value == price, "Please submit the asking price to complete the purchase");
        require(listedToken.currentlyListed, "Token is not listed for sale.");

        // Transfer NFT to the buyer and update ownership
        listedToken.currentlyListed = false;
        listedToken.owner = payable(msg.sender);
        listedToken.seller = payable(address(0));

        idToListedToken[tokenId] = listedToken;

        _itemsSold.increment();
        _transfer(address(this), msg.sender, tokenId);

        // Pay seller
        payable(seller).transfer(msg.value);
        emit TokenBought(tokenId);
    }

    function getOwnedTokens(address _owner) public view returns (uint256[] memory) {
        return ownerTokens[_owner];
    }

    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint256 nftCount = _tokenIds.current();
        uint256 listedCount = 0;

        // Count only listed tokens
        for (uint256 i = 1; i <= nftCount; i++) {
            if (idToListedToken[i].currentlyListed) {
                listedCount++;
            }
        }

        // Create an array for listed tokens
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

    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint256 itemCount = ownerTokens[msg.sender].length;
        ListedToken[] memory items = new ListedToken[](itemCount);

        for (uint256 i = 0; i < itemCount; i++) {
            uint256 tokenId = ownerTokens[msg.sender][i];
            items[i] = idToListedToken[tokenId];
        }

        return items;
    }

    function getTokenDetails(uint256 tokenId) public view returns (ListedToken memory) {
        require(tokenId > 0 && tokenId <= _tokenIds.current(), "Invalid token ID");
        return idToListedToken[tokenId];
    }

    function delistToken(uint256 tokenId) public nonReentrant {
        ListedToken storage token = idToListedToken[tokenId];

        require(msg.sender == token.seller, "Only the seller can delist the token");
        require(token.currentlyListed, "Token is not currently listed");

        token.currentlyListed = false;

        // Transfer NFT back to the seller
        _transfer(address(this), msg.sender, tokenId);

        emit TokenDelisted(tokenId, msg.sender);
    }

    function refundExcessPayment(uint256 requiredAmount) internal {
        if (msg.value > requiredAmount) {
            payable(msg.sender).transfer(msg.value - requiredAmount);
        }
    }
}
