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
import { uploadFileAndMetadataToPinata, updateMetadataOnPinata } from "../utils/uploadToPinata";
import { getNFTMetadata } from "../utils/pinata";
import { ethers, BrowserProvider } from "ethers";
import MarketplaceData from "../utils/Marketplace.json";

const SellerPortal = () => {
  const [formData, setFormData] = useState({
    eventName: "",
    date: "",
    location: "",
    maxPrice: "",
    quantity: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingTicket, setEditingTicket] = useState<any>(null); 
  const [editFormData, setEditFormData] = useState({
    eventName: "",
    date: "",
    location: "",
    maxPrice: "",
    quantity: "",
    description: "",
  });
  const [editLoading, setEditLoading] = useState(false); 

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
      
      if (!formData.maxPrice || parseFloat(formData.maxPrice) <= 0) {
        alert("Max price must be greater than 0.");
        setLoading(false);
        return;
      }  

      const metadata = {
        name: formData.eventName,
        description: formData.description,
        keyValues: {
          description: formData.description,
          date: formData.date,
          location: formData.location,
          maxPrice: formData.maxPrice,
          quantity: formData.quantity,
        },
        image: "", // Will be populated by Pinata upload
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
        ethers.parseEther(formData.maxPrice),
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

      const tokenIds = await contract.getMintedTokens(userAddress);

      const newTickets = await Promise.all(
        tokenIds.map(async (tokenId: any) => {
          const tokenDetails = await contract.getTokenDetails(tokenId);
          const tokenURI = await contract.tokenURI(tokenId);

          const metadataResult = await getNFTMetadata(tokenURI.replace("ipfs://", ""));
          const offchainmetadata: any = metadataResult.metadata || {};
          
          const imageUrl = offchainmetadata.image?.startsWith("ipfs://")
            ? `https://gateway.pinata.cloud/ipfs/${offchainmetadata.image.replace("ipfs://", "")}`
            : offchainmetadata.image || "";

          // Determine status
          let status = "Unlisted";
          if (tokenDetails.currentlyListed) {
            status = "Listed";
          } else if (tokenDetails.owner.toLowerCase() !== userAddress.toLowerCase()) {
            status = "Sold";
          }

          return {
            id: tokenId.toString(),
            eventName: tokenDetails.name,
            description: offchainmetadata.keyValues?.description || tokenDetails.description,
            date: offchainmetadata.keyValues?.date || "Unknown",
            location: offchainmetadata.keyValues?.location || "Unknown",
            price: ethers.formatUnits(tokenDetails.price.toString(), "ether"),
            maxPrice: ethers.formatUnits(tokenDetails.maxPrice.toString(), "ether"),
            image: imageUrl,
            status,
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

  const handleEditTicket = async (ticket: any) => {
    setEditingTicket(ticket); 
    setEditLoading(true); 
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const tokenURI = await contract.tokenURI(ticket.id);
      const tokenDetails = await contract.getTokenDetails(ticket.id);
      const metadataResult = await getNFTMetadata(tokenURI.replace("ipfs://", ""));

      if (metadataResult.success && metadataResult.metadata) {
        const metadata = metadataResult.metadata;

        setEditFormData({
          eventName: metadata.name || tokenDetails.name || "",
          description: metadata.keyValues?.description || tokenDetails.description || "",
          maxPrice: ethers.formatUnits(tokenDetails.maxPrice, "ether"),
          quantity: "", // Quantity is not stored on-chain, if needed store it in metadata
          date: metadata.keyValues?.date || "Unknown",
          location: metadata.keyValues?.location || "Unknown",
        });
      } else {
        console.error("Error fetching metadata from Pinata:", metadataResult.message);
        alert("Failed to load metadata. Check the console for details.");
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
      alert("An error occurred while fetching ticket metadata.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const submitEditTicket = async () => {
    if (!editingTicket) return;
    setEditLoading(true);
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        setEditLoading(false);
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const tokenURI = await contract.tokenURI(editingTicket.id);
      const cid = tokenURI.replace("ipfs://", "");
      const currentMetadataResult = await getNFTMetadata(cid);

      if (!currentMetadataResult.success || !currentMetadataResult.metadata) {
        throw new Error("Failed to fetch existing metadata from Pinata.");
      }

      const currentMetadata = currentMetadataResult.metadata;

      // Update maxPrice on-chain if changed
      if (editFormData.maxPrice && parseFloat(editFormData.maxPrice) > 0) {
        const tx = await contract.updateMaxPrice(
          editingTicket.id,
          ethers.parseEther(editFormData.maxPrice)
        );
        await tx.wait();
      } else {
        alert("Please enter a valid max price.");
        setEditLoading(false);
        return;
      }

      const updatedMetadata = {
        name: editFormData.eventName || currentMetadata.name,
        description: editFormData.description || currentMetadata.keyValues?.description,
        keyValues: {
          description: editFormData.description || currentMetadata.keyValues?.description,
          date: editFormData.date || currentMetadata.keyValues?.date,
          location: editFormData.location || currentMetadata.keyValues?.location
        },
        image: currentMetadata.image
      };

      const updateResponse = await updateMetadataOnPinata(cid, updatedMetadata);
      console.log("Metadata updated successfully on Pinata:", updateResponse);

      alert("Ticket updated successfully!");
      fetchMintedTickets(); 
      setEditingTicket(null); 
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket. Check the console for details.");
    } finally {
      setEditLoading(false);
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

        <Row className="mt-4 justify-content-center">
          <Col md={6} className="mx-auto p-5" style={{ backgroundColor: "#f8f9fa", borderRadius: "20px" }}>
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
                <Form.Label>Max Price (ETH)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter max price"
                  name="maxPrice"
                  value={formData.maxPrice}
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
                  <th>Max Price (ETH)</th>
                  <th>Status</th>
                  <th>Edit Ticket</th>
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
                    <td>{ticket.maxPrice}</td>
                    <td>{ticket.status}</td>
                    <td>{ticket.status === "Unlisted" ? (
                      <Button variant="warning" onClick={() => handleEditTicket(ticket)}>Edit Ticket</Button>
                    ) : ticket.status === "Listed" ? (
                      <Button variant="secondary" onClick={() => alert("You need to Unlist Your ticket first")}>Edit Ticket</Button>
                    ) : null }</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>

        {editingTicket && (
          <div className="modal show fade d-block">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Ticket Metadata</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditingTicket(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Event Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="eventName"
                        value={editFormData.eventName}
                        onChange={handleEditInputChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        type="text"
                        name="description"
                        value={editFormData.description}
                        onChange={handleEditInputChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Max Price (ETH)</Form.Label>
                      <Form.Control
                        type="number"
                        name="maxPrice"
                        value={editFormData.maxPrice || ""}
                        onChange={handleEditInputChange}
                        min="0"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantity</Form.Label>
                      <Form.Control
                        type="number"
                        name="quantity"
                        value={editFormData.quantity}
                        readOnly
                        style={{ backgroundColor: "#e9ecef" }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={editFormData.date}
                        onChange={handleEditInputChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <Form.Control
                        type="text"
                        name="location"
                        value={editFormData.location}
                        onChange={handleEditInputChange}
                      />
                    </Form.Group>
                  </Form>
                </div>
                <div className="modal-footer">
                  <Button
                    variant="secondary"
                    onClick={() => setEditingTicket(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={submitEditTicket}
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default SellerPortal;
