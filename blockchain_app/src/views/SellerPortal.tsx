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
import { uploadMetadataToPinata } from "../utils/uploadToPinata";
import { ethers, BrowserProvider } from "ethers";
import NFTMinterABI from "../contracts/NFTminter.json";

const SellerPortal = () => {
  const [formData, setFormData] = useState({
    eventName: "",
    date: "",
    location: "",
    price: "",
    quantity: "",
  });

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreateListing = async () => {
    setLoading(true);

    try {
      // Step 1: Upload metadata to Pinata
      const metadata = {
        name: formData.eventName,
        description: `Event at ${formData.location} on ${formData.date}`,
        attributes: {
          price: `${formData.price} ETH`,
          quantity: formData.quantity,
        },
      };

      const metadataCID = await uploadMetadataToPinata(metadata);
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${metadataCID}`;

      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        setLoading(false);
        return;
      }

      const networkVersion = await window.ethereum.request({ method: 'net_version' });
      if (networkVersion !== "17000") {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x4268" }], // Hexadecimal for Holesky (17000)
        });
      }
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(0);
      const nftContract = new ethers.Contract(
        "0x3F63A00116bFDA640986f868F93cf3be094045e4",
        NFTMinterABI,
        signer
      );

      const transaction = await nftContract.mintNFT(
        await signer.getAddress(),
        tokenURI
      );
      await transaction.wait();

      const newTicket = {
        ...formData,
        id: tickets.length + 1,
        status: "Minted",
      };
      setTickets([...tickets, newTicket]);

      setFormData({
        eventName: "",
        date: "",
        location: "",
        price: "",
        quantity: "",
      });

      alert("Ticket minted and listed successfully!");
    } catch (error) {
      console.error("Error minting ticket:", error);
      alert("Failed to mint the ticket. Check the console for details.");
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
