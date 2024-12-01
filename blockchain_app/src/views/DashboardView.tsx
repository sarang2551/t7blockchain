import React, { useEffect, useState } from "react";
import NavBar from "../component/NavigationBar";
import SearchBar from "../component/SearchBar";
import { Button, Card, Col, Row, Spinner, Container } from "react-bootstrap";
import MarketplaceData from "../utils/Marketplace.json";
import { GetIpfsUrlFromPinata } from "../utils/pinata";
import axios from "axios";
import { ethers } from "ethers";
import { NFT } from "../interfaces/INFT";

const DashboardView = () => {
  const [data, setData] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

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
      const contract = new ethers.Contract(MarketplaceData.address, MarketplaceData.abi, signer);

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
              currentlyListed: i.currentlyListed,
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

  const handleBuyNFT = async (tokenId: number, price: number) => {
    setBuying(true);
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        setBuying(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(MarketplaceData.address, MarketplaceData.abi, signer);

      const transaction = await contract.executeSale(tokenId, {
        value: ethers.parseEther(price.toString()),
      });
      await transaction.wait();

      alert(`Successfully purchased NFT with ID ${tokenId}!`);
      getAllNFTs(); // Refresh the NFT list
    } catch (error) {
      console.error("Error buying NFT:", error);
      alert("Failed to purchase NFT. Check the console for details.");
    }
    setBuying(false);
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
      <Container className="mt-4">
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" />
            <p>Loading NFTs...</p>
          </div>
        ) : data.length > 0 ? (
          <Row>
            {data.map((nft) => (
              <Col key={nft.tokenId} md={4} className="mb-4">
                <Card>
                  <Card.Img variant="top" src={nft.image} />
                  <Card.Body>
                    <Card.Title>{nft.name}</Card.Title>
                    <Card.Text>{nft.description}</Card.Text>
                    <Card.Text>
                      <strong>Price:</strong> {nft.price} ETH
                    </Card.Text>
                    <Card.Text>
                      <strong>Seller:</strong> {nft.seller}
                    </Card.Text>
                    {nft.currentlyListed && (
                      <Button
                        variant="primary"
                        onClick={() => handleBuyNFT(nft.tokenId, nft.price)}
                        disabled={buying}
                      >
                        {buying ? "Processing..." : "Buy NFT"}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center">
            <p>No NFTs available for sale.</p>
          </div>
        )}
      </Container>
    </div>
  );
};

export default DashboardView;
