import React, { useEffect, useState } from "react";
import NavBar from "../component/NavigationBar";
import SearchBar from "../component/SearchBar";
import { Button, Card, Col, Row} from "react-bootstrap";
import CarouselShow from "../component/CarouselShow";
import MarketplaceData from "../contracts/MarketPlace.json"
import {ethers,BrowserProvider} from 'ethers'
import {getNFTMetadata} from "../utils/pinata"
import { ListedToken } from "../interfaces/ListedToken";

const DashboardView = () => {
  // get all the NFT tickets from the smart contract
  const [NFTList,setNFTList] = useState<ListedToken[]>([])
  const fetchAllListedNFT = async() => {
    const provider = window.ethereum ? new BrowserProvider(window.ethereum) : null;
    if(!provider){
      alert("Meta mask has not been installed!")
      return
    }
    const signer = await provider.getSigner();
    const nftContract = new ethers.Contract(
      MarketplaceData.address,
      MarketplaceData.abi,
      signer
    );
    const allListedNFTs = await nftContract.getAllNFTs()
    // TODO: Add loading component logic
      const parsedNFTs = await Promise.all(
        allListedNFTs.map(async (nft:any) => {
          try {
            // Fetch token URI for metadata
            const tokenURI = await nftContract.tokenURI(nft.tokenId);
            
            // Fetch off-chain metadata using the tokenURI
            const metadataResult = await getNFTMetadata(tokenURI.replace("ipfs://", ""));
            const offchainmetadata = metadataResult.metadata;
    
            // Build the image URL from IPFS
            const imageUrl = `https://gateway.pinata.cloud/ipfs/${tokenURI.replace("ipfs://", "")}`;
    
            return {
              id: nft.tokenId.toString(),
              eventName: offchainmetadata?.name,
              description: offchainmetadata?.keyValues?.description || "No description available",
              date: offchainmetadata?.keyValues?.date || "Unknown",
              location: offchainmetadata?.keyValues?.location || "Unknown",
              price: ethers.formatUnits(nft.price.toString(), "ether"),
              image: imageUrl,
              status: nft.currentlyListed
                ? "Listed"
                : nft.owner.toLowerCase() !== nft.seller.toLowerCase()
                ? "Sold"
                : "Unlisted",
            };
          } catch (error) {
            console.error(`Failed to parse NFT with tokenId ${nft.tokenId}:`, error);
            return null; // Return null or handle errors gracefully
          }
        })
      );
      console.log(parsedNFTs)
      // Filter out null values in case of errors
      return parsedNFTs.filter((nft) => nft !== null);
  }
  useEffect(()=>{
    fetchAllListedNFT().then((res:any)=>setNFTList(res)) //TODO: Create a NFT Class
  },[])
  return (
    <div>
      <Row>
        <NavBar />
      </Row>
      <Row className="mt-4" md={12}>
        <Col className="mx-auto" md={6} >
          <SearchBar />
        </Col>
      </Row>
      <Row md={12} className="mt-4 d-flex align-items-center">
        <Col md={{offset:2,span:3}} >
        <Card>
            <Card.Header>Concert</Card.Header>
            <Card.Body><Button variant="dark">Buy Tickets!</Button></Card.Body>
        </Card>
        </Col>
        <Col md={6}>
        <CarouselShow listedTokens={NFTList}/>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardView;