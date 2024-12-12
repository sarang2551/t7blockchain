import React, { useEffect, useState } from "react";
import NavBar from "../component/NavigationBar";
import {
  Col,
  Row,
  Card,
  Button,
  Container,
  Spinner,
  Badge,
} from "react-bootstrap";
import MarketplaceData from "../utils/Marketplace.json";
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

      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      // Fetch owned token IDs
      const tokenIds = await contract.getOwnedTokens(userAddress);

      const ownedTickets: NFT[] = [];

      for (const tokenId of tokenIds) {
        try {
          const tokenDetails = await contract.getTokenDetails(tokenId);
          const tokenURI = await contract.tokenURI(tokenId);
          const cid = tokenURI.replace("ipfs://", "");
          const result = await getNFTMetadata(cid);

          if (result.success && result.metadata) {
            const metadata = result.metadata;

            const imageUrl = metadata.image?.startsWith("ipfs://")
              ? `https://gateway.pinata.cloud/ipfs/${metadata.image.replace("ipfs://", "")}`
              : metadata.image || "";

            const ticket: NFT = {
              tokenId,
              seller: tokenDetails.seller,
              image: imageUrl,
              name: tokenDetails.name || "Unnamed Event",
              description: metadata.keyValues?.description || tokenDetails.description || "No description provided",
              price: parseFloat(
                ethers.formatUnits(tokenDetails.price?.toString() || "0", "ether")
              ),
              eventDate: metadata.keyValues?.date || "Unknown",
              location: metadata.keyValues?.location || "Unknown",
              currentlyListed: tokenDetails.currentlyListed,
              minter: tokenDetails.minter, 
            };

            ownedTickets.push(ticket);
          } else {
            console.error(
              `Failed to fetch metadata for token ${tokenId}:`,
              result.message
            );
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

  const handleListForSale = async (ticket: NFT) => {
    const priceInETH = prompt("Enter the price in ETH for this NFT:");
    if (priceInETH) {
      try {
        if (!window.ethereum) {
          alert("MetaMask is not installed!");
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          MarketplaceData.address,
          MarketplaceData.abi,
          signer
        );

        const priceWei = ethers.parseEther(priceInETH).toString();
        // If there's a listing fee or listPrice required, fetch it here if your contract requires it.
        // const listPrice = await contract.getListPrice(); 
        // If not needed, remove the line above and { value: listPrice } from the transaction below.

        const transaction = await contract.listToken(ticket.tokenId, priceWei);
        await transaction.wait();

        alert(`NFT with ID ${ticket.tokenId} listed for sale!`);
        getOwnedTickets(); 
      } catch (error) {
        console.error("Error listing NFT:", error);
        alert("Failed to list the NFT. Check the console for details.");
      }
    }
  };

  const handleUnlist = async (ticket: NFT) => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const transaction = await contract.delistToken(ticket.tokenId);
      await transaction.wait();

      alert(`NFT with ID ${ticket.tokenId} has been unlisted.`);
      getOwnedTickets(); 
    } catch (error) {
      console.error("Error unlisting NFT:", error);
      alert("Failed to unlist the NFT. Check the console for details.");
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
                    src={ticket.image}
                    style={{
                      width: "100%",
                      height: "300px",
                      objectFit: "cover",
                      borderTopLeftRadius: "5px",
                      borderTopRightRadius: "5px",
                    }}
                  />
                  <Card.Body>
                    <Card.Title>{ticket.name}</Card.Title>
                    <Card.Text>{ticket.description}</Card.Text>
                    <Card.Text>
                      <Badge bg="info">Date: {ticket.eventDate}</Badge> <br />
                      <Badge bg="secondary">Location: {ticket.location}</Badge>
                    </Card.Text>
                    <Card.Text>
                      <strong>Price:</strong>{" "}
                      {ticket.currentlyListed
                        ? `${ticket.price} ETH`
                        : "Not Listed"}
                    </Card.Text>
                    {ticket.currentlyListed ? (
                      <Button
                        variant="danger"
                        onClick={() => handleUnlist(ticket)}
                      >
                        Unlist from Sale
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        onClick={() => handleListForSale(ticket)}
                      >
                        List for Sale
                      </Button>
                    )}
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
