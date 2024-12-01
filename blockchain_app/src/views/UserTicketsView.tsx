import React, { useEffect, useState } from "react";
import NavBar from "../component/NavigationBar";
import { Col, Row, Card, Button, Container, Spinner } from "react-bootstrap";
import MarketplaceJSON from "../utils/Marketplace.json";
import MarketplaceABI from "../utils/MarketplaceABI.json";
import { getNFTMetadata } from "../utils/pinata";
import { ethers } from "ethers";
import { NFT } from "../interfaces/INFT";

const MyTickets = () => {
  const [tickets, setTickets] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  const getOwnedTickets = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      const networkVersion = await window.ethereum.request({
        method: "net_version",
      });
      if (networkVersion !== "17000") {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x4268" }],
        });
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const contractAddress = MarketplaceJSON.address;
      const contract = new ethers.Contract(contractAddress, MarketplaceABI, signer);

      // Fetch owned token IDs from the custom smart contract function
      const tokenIds = await contract.getOwnedTokens(userAddress);

      const ownedTickets: NFT[] = [];
      for (const tokenId of tokenIds) {
        try {
          const tokenURI = await contract.tokenURI(tokenId);

          // Extract CID from the tokenURI (e.g., ipfs://<CID>)
          const cid = tokenURI.replace("ipfs://", "");
          const result = await getNFTMetadata(cid);

          if (result.success && result.metadata) {
            const metadata = result.metadata;
            const imageUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

            ownedTickets.push({
              tokenId,
              owner: userAddress,
              image: metadata.image,
              name: metadata.name,
              description: metadata.keyValues.description || "No description provided",
              price: metadata.keyValues.price || "0",
              seller: userAddress,
              currentlyListed: false, // Update if contract includes a listing query
            });
          } else {
            console.error(`Failed to fetch metadata for token ${tokenId}:`, result.message);
          }
        } catch (error) {
          console.error(`Error fetching metadata for tokenId ${tokenId}:`, error);
        }
      }

      setTickets(ownedTickets);
    } catch (error) {
      console.error("Error fetching owned tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOwnedTickets();
  }, []);

  return (
    <div>
      <NavBar />
      <Container className="mt-4">
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p>Loading your tickets...</p>
          </div>
        ) : tickets.length > 0 ? (
          <Row>
            {tickets.map((ticket) => (
              <Col md={4} key={ticket.tokenId} className="mb-4">
                <Card>
                  <Card.Img
                    variant="top"
                    src={
                        ticket.image?.startsWith("ipfs://")
                          ? `https://gateway.pinata.cloud/ipfs/${ticket.image.replace("ipfs://", "")}`
                          : ticket.image
                      }
                  />
                  <Card.Body>
                    <Card.Title>{ticket.name}</Card.Title>
                    <Card.Text>{ticket.description}</Card.Text>
                    <Card.Text>
                      <strong>Token ID:</strong> {ticket.tokenId}
                    </Card.Text>
                    <Card.Text>
                      <strong>Price:</strong> {ethers.formatEther(ticket.price)} ETH
                    </Card.Text>
                    <Button variant="primary">View on Marketplace</Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center">
            <p>You don’t own any tickets yet.</p>
          </div>
        )}
      </Container>
    </div>
  );
};

export default MyTickets;
