import { useEffect, useState } from "react";
import NavBar from "../component/NavigationBar";
import {
  Form,
  Button,
  Table,
  Container,
  Row,
  Col,
  Spinner,
  Image,
} from "react-bootstrap";
import { uploadFileAndMetadataToPinata } from "../utils/uploadToPinata";
import { getNFTMetadata } from "../utils/pinata";
import { ethers, BrowserProvider } from "ethers";
import MarketplaceData from "../utils/Marketplace.json";

const SellerPortal = () => {
  const [formData, setFormData] = useState({
    eventName: "",
    date: "",
    location: "",
    price: "",
    quantity: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleCreateListing = async () => {
    setLoading(true);

    try {
      if (!imageFile) {
        alert("Please upload an image for the NFT.");
        setLoading(false);
        return;
      }

      if (!formData.quantity || parseInt(formData.quantity) <= 0) {
        alert("Quantity must be greater than 0.");
        setLoading(false);
        return;
      }

      const metadata = {
        name: formData.eventName,
        description: formData.description,
        attributes: [
          { trait_type: "Price", value: ethers.parseEther(formData.price).toString() },
          { trait_type: "Quantity", value: formData.quantity },
          { trait_type: "Date", value: formData.date },
          { trait_type: "Location", value: formData.location },
        ],
      };

      const uploadResponse = await uploadFileAndMetadataToPinata(imageFile, metadata);
      console.log("Uploaded to Pinata:", uploadResponse);

      const tokenURI = `ipfs://${uploadResponse.IpfsHash}`;

      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        setLoading(false);
        return;
      }

      const networkVersion = await window.ethereum.request({ method: "net_version" });
      if (networkVersion !== "17000") {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x4268" }],
        });
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(0);
      const nftContract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const transaction = await nftContract.mintBatch(
        tokenURI,
        ethers.parseEther(formData.price),
        formData.eventName,
        formData.description,
        parseInt(formData.quantity)
      );
      await transaction.wait();

      alert(`${formData.quantity} ticket${parseInt(formData.quantity) > 1 ? "s" : ""} minted successfully!`);
      fetchMintedTickets();
    } catch (error) {
      console.error("Error minting tickets:", error);
      alert("Failed to mint the tickets. Check the console for details.");
    }

    setLoading(false);
  };

  const fetchMintedTickets = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const tokenIds = await contract.getOwnedTokens(userAddress);

      const newTickets = await Promise.all(
        tokenIds.map(async (tokenId: any) => {
          const tokenDetails = await contract.getTokenDetails(tokenId);
          const tokenURI = await contract.tokenURI(tokenId);

          const onchainmetadata = tokenDetails;
          const metadataResult = await getNFTMetadata(tokenURI.replace("ipfs://", ""));
          const offchainmetadata = metadataResult.metadata;

          const imageUrl = `https://gateway.pinata.cloud/ipfs/${tokenURI.replace("ipfs://", "")}`;

          return {
            id: tokenId.toString(),
            eventName: offchainmetadata?.name,
            description: offchainmetadata?.keyValues.description,
            date: offchainmetadata?.keyValues.date || "Unknown",
            location: offchainmetadata?.keyValues.location || "Unknown",
            price: ethers.formatUnits(onchainmetadata.price.toString(), "ether"),
            image: imageUrl,
            status: onchainmetadata.currentlyListed
              ? "Listed"
              : tokenDetails.owner.toLowerCase() !== userAddress.toLowerCase()
              ? "Sold"
              : "Unlisted",
          };
        })
      );

      setTickets(newTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMintedTickets();
  }, []);

  return (
    <div>
      <NavBar />
      <Container className="mt-4">
        <h1>Seller's Portal</h1>

        {/* Form for Minting Tickets */}
        <Row className="mt-4">
          <Col md={6}>
            <h4>Create a New Event</h4>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Event Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter event name"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter event description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Price (ETH)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Quantity</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter ticket quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Event Image</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleCreateListing}
                disabled={loading}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  "Mint Tickets"
                )}
              </Button>
            </Form>
          </Col>
        </Row>

        {/* Table of Active Listings */}
        <Row className="mt-5">
          <Col>
            <h4>My Minted Tickets</h4>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Thumbnail</th>
                  <th>Event Name</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Price (ETH)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, index) => (
                  <tr key={ticket.id}>
                    <td>{index + 1}</td>
                    <td>
                      <Image src={ticket.image} thumbnail width={50} />
                    </td>
                    <td>{ticket.eventName}</td>
                    <td>{ticket.description}</td>
                    <td>{ticket.date}</td>
                    <td>{ticket.location}</td>
                    <td>{ticket.price}</td>
                    <td>{ticket.status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SellerPortal;