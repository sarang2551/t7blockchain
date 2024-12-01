import React, { useEffect, useState } from "react";
import NavBar from "../component/NavigationBar";
import SearchBar from "../component/SearchBar";
import { Button, Card, Col, Row } from "react-bootstrap";
import CarouselShow from "../component/CarouselShow";
import MarketplaceJSON from "../utils/Marketplace.json";
import MarketplaceABI from "../utils/MarketplaceABI.json";
import { GetIpfsUrlFromPinata } from "../utils/pinata";
import axios from "axios";
import { ethers } from "ethers";
import { NFT } from "../interfaces/INFT";

const DashboardView = () => {
  const [data, setData] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  const getAllNFTs = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      const networkVersion = await window.ethereum.request({ method: "net_version" });
      if (networkVersion !== "17000") {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x4268" }], // Hexadecimal for Holesky (17000)
        });
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Pull the deployed contract instance
      const contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceABI, signer);

      // Fetch all NFTs from the contract
      const transaction = await contract.getAllNFTs();

      // Fetch all details of every NFT from the contract and prepare the data
      const items: NFT[] = await Promise.all(
        transaction.map(async (i: NFT) => {
          try {
            let tokenURI = await contract.tokenURI(i.tokenId);
            tokenURI = GetIpfsUrlFromPinata(tokenURI);

            const meta = await axios.get(tokenURI).then((response) => response.data);

            const price = ethers.formatUnits(i.price.toString(), "ether");

            return {
              price,
              tokenId: i.tokenId,
              seller: i.seller,
              owner: i.owner,
              image: meta.image,
              name: meta.name,
              description: meta.description,
            };
          } catch (error) {
            console.error(`Error fetching metadata for tokenId ${i.tokenId}:`, error);
            return null; // Skip this NFT if there's an issue
          }
        })
      );

      // Filter out any null items
      setData(items.filter((item) => item !== null));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) {
      getAllNFTs();
    }
  }, [loading]);

  return (
    <div>
      <Row>
        <NavBar />
      </Row>
      <Row className="mt-4" md={12}>
        <Col className="mx-auto" md={6}>
          <SearchBar />
        </Col>
      </Row>
      <Row md={12} className="mt-4 d-flex align-items-center">
        <Col md={6}>
          {loading ? (
            <div className="text-center">
              <p>Loading NFTs...</p>
            </div>
          ) : data.length > 0 ? (
            <CarouselShow nftList={data} />
          ) : (
            <div className="text-center">
              <p>No NFTs available.</p>
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default DashboardView;
