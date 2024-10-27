import React, {useEffect, useState} from "react";
import NavBar from "../component/NavigationBar";
import SearchBar from "../component/SearchBar";
import { Button, Card, Col, Row} from "react-bootstrap";
import CarouselShow from "../component/CarouselShow";
import MarketplaceJSON from "../utils/Marketplace.json"
import { GetIpfsUrlFromPinata } from "../utils/pinata";
import axios from "axios"
import {ethers} from "ethers"

const DashboardView = () => {
  const [data, updateData] = useState<NFT[]>([]);
  const [dataFetched, updateFetched] = useState(false);
  async function getAllNFTs() {
    //After adding your Hardhat network to your metamask, this code will get providers and signers
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    //Pull the deployed contract instance
    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
    //create an NFT Token
    let transaction = await contract.getAllNFTs()

    //Fetch all the details of every NFT from the contract and display
    const items : NFT[] = await Promise.all(transaction.map(async (i:NFT) => {
        var tokenURI = await contract.tokenURI(i.tokenId);
        console.log("getting this tokenUri", tokenURI);
        tokenURI = GetIpfsUrlFromPinata(tokenURI);
        let meta : any = await axios.get(tokenURI);
        meta = meta.data;

        let price = ethers.formatUnits(i.price.toString(), 'ether');
        let item = {
            price,
            tokenId: i.tokenId,
            seller: i.seller,
            owner: i.owner,
            image: meta.image,
            name: meta.name,
            description: meta.description,
        }
        return item;
    }))

    updateFetched(true);
    updateData(items);
  }

  useEffect(()=>{
    getAllNFTs()
  },[dataFetched])

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
        {/* <Col md={{offset:2,span:3}} >
        <Card>
            <Card.Header>Concert</Card.Header>
            <Card.Body><Button variant="dark">Buy Tickets!</Button></Card.Body>
        </Card>
        </Col> */}
        <Col md={6}>
        <CarouselShow nftList={data}/>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardView;