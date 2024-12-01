import { useState } from "react";
import NavBar from "../component/NavigationBar";
import {
  Form,
  Button,
  Table,
  Container,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import { uploadFileAndMetadataToPinata } from "../utils/uploadToPinata";
import { ethers, BrowserProvider } from "ethers";
import MarketplaceData from "../contracts/MarketPlace.json";

const SellerPortal = () => {
  const [formData, setFormData] = useState({
    eventName: "",
    date: "",
    location: "",
    price: "",
    quantity: "",
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
  
      // Step 1: Create metadata
      const metadata = {
        name: formData.eventName,
        description: `Event at ${formData.location} on ${formData.date}`,
        attributes: [
          { trait_type: "Price", value: ethers.parseEther(formData.price).toString() }, // Price in Wei
          { trait_type: "Quantity", value: formData.quantity },
          { trait_type: "Date", value: formData.date },
          { trait_type: "Location", value: formData.location },
        ],
      };
  
      // Step 2: Upload image and metadata to Pinata
      const uploadResponse = await uploadFileAndMetadataToPinata(imageFile, metadata);
      console.log("Uploaded to Pinata:", uploadResponse);
  
      // Extract CID from uploadResponse
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
          params: [{ chainId: "0x4268" }], // Hexadecimal for Holesky (17000)
        });
      }
  
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(0);
      const nftContract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );
  
      // Call mintBatch on the contract
      const transaction = await nftContract.mintBatch(
        tokenURI,
        ethers.parseEther(formData.price), // Price in Wei
        formData.eventName,
        `Event at ${formData.location} on ${formData.date}`,
        parseInt(formData.quantity) // Quantity to mint
      );
      await transaction.wait();
  
      const newTickets = Array.from({ length: parseInt(formData.quantity) }, (_, index) => ({
        ...formData,
        id: tickets.length + index + 1,
        status: "Minted",
      }));
      setTickets([...tickets, ...newTickets]);
  
      setFormData({
        eventName: "",
        date: "",
        location: "",
        price: "",
        quantity: "",
      });
      setImageFile(null);
  
      alert(`${formData.quantity} ticket${parseInt(formData.quantity) > 1 ? 's' : ''} minted successfully!`);
    } catch (error) {
      console.error("Error minting tickets:", error);
      alert("Failed to mint the tickets. Check the console for details.");
    }
  
    setLoading(false);
  };
  
      
  
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
                  "Mint and List Tickets"
                )}
              </Button>
            </Form>
          </Col>
        </Row>

        {/* Table of Active Listings */}
        <Row className="mt-5">
          <Col>
            <h4>My Tickets</h4>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Price (ETH)</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.id}</td>
                    <td>{ticket.eventName}</td>
                    <td>{ticket.date}</td>
                    <td>{ticket.location}</td>
                    <td>{ticket.price}</td>
                    <td>{ticket.quantity}</td>
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
