import { ethers } from "hardhat";
import { expect } from "chai";

describe("NFTMarketplace", function () {
  let NFTMarketplace: any;
  let nftMarketplace: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    // Deploy the contract
    NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    [owner, addr1, addr2] = await ethers.getSigners();
    nftMarketplace = await NFTMarketplace.deploy();
    await nftMarketplace.deployed();
  });

  it("Should allow a whitelisted user to mint an NFT", async function () {
    // Whitelist the user
    await nftMarketplace.whitelistAddress(addr1.address, "Organizer");

    const tokenURI = "https://example.com/token-metadata";
    const maxPrice = ethers.utils.parseEther("1"); // Max price of 1 ETH
    const name = "Test NFT";
    const description = "Test NFT Description";

    // Mint an NFT
    await nftMarketplace.connect(addr1).mintBatch(tokenURI, maxPrice, name, description, 1);

    const ownedTokens = await nftMarketplace.getOwnedTokens(addr1.address);
    expect(ownedTokens.length).to.equal(1);

    const tokenDetails = await nftMarketplace.getTokenDetails(ownedTokens[0]);
    expect(tokenDetails.name).to.equal(name);
    expect(tokenDetails.description).to.equal(description);
    expect(tokenDetails.maxPrice).to.equal(maxPrice);
  });

  it("Should prevent a non-whitelisted user from minting an NFT", async function () {
    const tokenURI = "https://example.com/token-metadata";
    const maxPrice = ethers.utils.parseEther("1");
    const name = "Test NFT";
    const description = "Test NFT Description";

    await expect(
      nftMarketplace.connect(addr1).mintBatch(tokenURI, maxPrice, name, description, 1)
    ).to.be.revertedWith("Address not whitelisted for minting.");
  });

  it("Should list an NFT for sale within the max price", async function () {
    // Whitelist the user and mint an NFT
    await nftMarketplace.whitelistAddress(addr1.address, "Organizer");
    const tokenURI = "https://example.com/token-metadata";
    const maxPrice = ethers.utils.parseEther("1");
    const name = "Test NFT";
    const description = "Test NFT Description";

    await nftMarketplace.connect(addr1).mintBatch(tokenURI, maxPrice, name, description, 1);

    const ownedTokens = await nftMarketplace.getOwnedTokens(addr1.address);
    const tokenId = ownedTokens[0];

    // List the NFT for sale
    const listPrice = ethers.utils.parseEther("0.5");
    await nftMarketplace.connect(addr1).listToken(tokenId, listPrice, { value: ethers.utils.parseEther("0.01") });

    const tokenDetails = await nftMarketplace.getTokenDetails(tokenId);
    expect(tokenDetails.currentlyListed).to.be.true;
    expect(tokenDetails.price).to.equal(listPrice);
  });

  it("Should prevent listing an NFT for sale above the max price", async function () {
    // Whitelist the user and mint an NFT
    await nftMarketplace.whitelistAddress(addr1.address, "Organizer");
    const tokenURI = "https://example.com/token-metadata";
    const maxPrice = ethers.utils.parseEther("1");
    const name = "Test NFT";
    const description = "Test NFT Description";

    await nftMarketplace.connect(addr1).mintBatch(tokenURI, maxPrice, name, description, 1);

    const ownedTokens = await nftMarketplace.getOwnedTokens(addr1.address);
    const tokenId = ownedTokens[0];

    // Try listing the NFT above the max price
    const listPrice = ethers.utils.parseEther("2"); // Above the max price
    await expect(
      nftMarketplace.connect(addr1).listToken(tokenId, listPrice, { value: ethers.utils.parseEther("0.01") })
    ).to.be.revertedWith("Price exceeds max allowed by minter.");
  });

  it("Should allow a buyer to purchase an NFT", async function () {
    // Whitelist the user and mint an NFT
    await nftMarketplace.whitelistAddress(addr1.address, "Organizer");
    const tokenURI = "https://example.com/token-metadata";
    const maxPrice = ethers.utils.parseEther("1");
    const name = "Test NFT";
    const description = "Test NFT Description";

    await nftMarketplace.connect(addr1).mintBatch(tokenURI, maxPrice, name, description, 1);

    const ownedTokens = await nftMarketplace.getOwnedTokens(addr1.address);
    const tokenId = ownedTokens[0];

    // List the NFT for sale
    const listPrice = ethers.utils.parseEther("0.5");
    await nftMarketplace.connect(addr1).listToken(tokenId, listPrice, { value: ethers.utils.parseEther("0.01") });

    // Purchase the NFT
    await nftMarketplace.connect(addr2).executeSale(tokenId, { value: listPrice });

    const tokenDetails = await nftMarketplace.getTokenDetails(tokenId);
    expect(tokenDetails.owner).to.equal(addr2.address);
    expect(tokenDetails.currentlyListed).to.be.false;
  });
});
