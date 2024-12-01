import React, { useEffect, useState } from "react";
import NavBar from "../component/NavigationBar";
import { Col, Row, Card, Button, Container, Spinner } from "react-bootstrap";
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

      const contractAddress = MarketplaceData.address;
      const contract = new ethers.Contract(contractAddress, MarketplaceData.abi, signer);

      // Fetch owned token IDs from the custom smart contract function
      const tokenIds = await contract.getOwnedTokens(userAddress);

      const ownedTickets: NFT[] = [];
      const eventCounter: { [key: string]: number } = {}; // Counter for events

      for (const tokenId of tokenIds) {
        try {
          const tokenURI = await contract.tokenURI(tokenId);

          // Extract CID from the tokenURI (e.g., ipfs://<CID>)
          const cid = tokenURI.replace("ipfs://", "");
          const result = await getNFTMetadata(cid);

          if (result.success && result.metadata) {
            const metadata = result.metadata;
            const eventName = metadata.name || "Unnamed Event";
            eventCounter[eventName] = (eventCounter[eventName] || 0) + 1;

            ownedTickets.push({
              tokenId,
              owner: userAddress,
              image: metadata.image,
              name: `${eventName} #${eventCounter[eventName]}`, // Add indicator
              description: metadata.keyValues.description || "No description provided",
              price: metadata.keyValues.price || "0",
              seller: userAddress,
              eventDate: metadata.keyValues.date,
              location: metadata.keyValues.location,
              currentlyListed: await contract.getTokenDetails(tokenId).then((t) => t.currentlyListed),
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

  const handleListForSale = async (ticket: NFT) => {
    const priceInWei = prompt("Enter the price in ETH for this NFT:");
    if (priceInWei) {
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
        const contract = new ethers.Contract(
          MarketplaceData.address,
          MarketplaceData.abi,
          signer
        );

        const priceWei = ethers.parseEther(priceInWei).toString();
        const listPrice = await contract.getListPrice();

        const transaction = await contract.listToken(ticket.tokenId, priceWei, {
          value: listPrice,
        });
        await transaction.wait();

        alert(`NFT with ID ${ticket.tokenId} listed for sale!`);
        getOwnedTickets(); // Refresh tickets after listing
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
      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const transaction = await contract.delistToken(ticket.tokenId);
      await transaction.wait();

      alert(`NFT with ID ${ticket.tokenId} has been unlisted.`);
      getOwnedTickets(); // Refresh tickets after unlisting
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
                      <strong>Price:</strong>{" "}
                      {ticket.currentlyListed
                        ? `${ethers.formatEther(ticket.price)} ETH`
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
