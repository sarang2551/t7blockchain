// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTMinter is ERC721URIStorage {
    using Counters for Counters.Counter;

    // Tracks the token IDs
    Counters.Counter private _tokenIds;

    // Address of the contract owner
    address public owner;

    // Constructor to initialize the contract
    constructor() ERC721("NFTMinter", "NFTM") {
        owner = msg.sender; // Set the contract deployer as the owner
    }

    // Modifier to restrict certain functions to the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    // Function to mint a new NFT
    function mintNFT(address recipient, string memory tokenURI)
        public
        returns (uint256)
    {
        // Increment the token ID counter
        _tokenIds.increment();

        // Get the new token ID
        uint256 newTokenId = _tokenIds.current();

        // Mint the NFT to the recipient
        _safeMint(recipient, newTokenId);

        // Set the token URI (metadata link)
        _setTokenURI(newTokenId, tokenURI);

        return newTokenId;
    }

    // Function to get the total number of minted tokens
    function getTotalMinted() public view returns (uint256) {
        return _tokenIds.current();
    }
}
