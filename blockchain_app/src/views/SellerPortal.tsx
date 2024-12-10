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

interface MetadataKeyValues {
  description?: string;
  date?: string;
  location?: string;
  [key: string]: any; // Allow additional properties in keyValues
}

interface Metadata {
  name?: string;
  keyValues?: MetadataKeyValues;
  image?: string; // Add 'image' as it's mentioned in the error
  [key: string]: any; // Allow additional properties in metadata
}



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

  //for editing files
  const [editingTicket, setEditingTicket] = useState<any>(null); // Current ticket being edited
  const [editFormData, setEditFormData] = useState({
    eventName: "",
    date: "",
    location: "",
    price: "",
    quantity: "",
    description: "",
  });
  const [editLoading, setEditLoading] = useState(false); // Loading state for editing


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

  // const handleEditTicket = (ticketId: string) => {
  //   // Redirect or open a modal to edit the ticket
  //   console.log(`Editing ticket with ID: ${ticketId}`);
  //   alert(`Editing ticket with ID: ${ticketId}`);
  // };

  const handleEditTicket = async (ticket: any) => {
    console.log("Fetched Token Details:", ticket);
    setEditingTicket(ticket); // Set the ticket being edited
    setEditLoading(true); // Show loading indicator while fetching data
  
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      console.log("Fetched Token Details 2:", ticket);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      // Fetch metadata from Pinata using the token URI
      console.log("Fetched Token Details 2:", ticket.id);
      const tokenURI = await contract.tokenURI(ticket.id);
      const tokenDetails = await contract.getTokenDetails(ticket.id);
      const metadataResult = await getNFTMetadata(tokenURI.replace("ipfs://", ""));

      if (metadataResult.success && metadataResult.metadata) {
        const metadata = metadataResult.metadata as Metadata;

  
        // Populate the edit form with the fetched metadata
        setEditFormData({
          eventName: metadata.name || "",
          description: metadata.keyValues?.description || "",
          price: ethers.formatUnits(tokenDetails.price, "ether"),
          quantity: metadata.keyValues?.quantity || "",
          date: metadata.keyValues?.date || "",
          location: metadata.keyValues?.location || "",
        });
        //console.log('inside handled edit ticket ', ethers.formatUnits(tokenDetails.price, "ether"));
      } else {
        console.error("Error fetching metadata from Pinata:", metadataResult.message);
        alert("Failed to load metadata. Check the console for details.");
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
      alert("An error occurred while fetching ticket metadata.");
    } finally {
      setEditLoading(false); // Hide loading indicator
    }
  };
  
  const fetchImageAsBlob = async (imageUrl: string): Promise<File> => {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image from URL");
  
    const blob = await response.blob();
    const fileName = imageUrl.split("/").pop() || "file"; // Use the file name from the URL
    return new File([blob], fileName, { type: blob.type }); // Convert Blob to File
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

       // Fetch the current metadata from Pinata
      const tokenURI = await contract.tokenURI(editingTicket.id);
      const cid = tokenURI.replace("ipfs://","");
      const currentMetadataResult = await getNFTMetadata(cid);

      if (!currentMetadataResult.success || !currentMetadataResult.metadata) {
        throw new Error("Failed to fetch existing metadata from Pinata.");
      }

      const currentMetadata = currentMetadataResult.metadata;

      // const updatedMetadata = {
      //   name: editFormData.eventName,
      //   description: editFormData.description,
      //   attributes: [
      //     { trait_type: "Price", value: ethers.parseEther(editFormData.price).toString() },
      //     { trait_type: "Quantity", value: editFormData.quantity.toString() },
      //     { trait_type: "Date", value: editFormData.date.toString },
      //     { trait_type: "Location", value: editFormData.location.toString() },
      //   ],
      // };

      const updatedMetadata = {
        name: editFormData.eventName || currentMetadata.name,
        description: editFormData.description || currentMetadata.keyValues.description,
        attributes: [
          {
            trait_type: "Price",
            value: ethers.parseEther(editFormData.price || ethers.formatUnits(editingTicket.price, "ether")).toString(),
          },
          {
            trait_type: "Quantity",
            value: editFormData.quantity || currentMetadata.keyValues?.quantity || "",
          },
          {
            trait_type: "Date",
            value: editFormData.date || currentMetadata.keyValues?.date || "",
          },
          {
            trait_type: "Location",
            value: editFormData.location || currentMetadata.keyValues?.location || "",
          },
        ],
      };
      //console.log("Updated Metadata:", updatedMetadata);
      
      console.log("Updating metadata for CID:", cid);

      // Update metadata on Pinata
      const updateResponse = await updateMetadataOnPinata(cid, updatedMetadata);
      console.log("Metadata updated successfully:", updateResponse);


      
  
      
  
      // Update metadata on the blockchain
      //const transaction = await contract.updateTokenMetadata(
      //  editingTicket.id, // Token ID
      //  newTokenURI
      //);
      //await transaction.wait();
  
      alert("Ticket updated successfully!");
      fetchMintedTickets(); // Refresh tickets
      setEditingTicket(null); // Close modal
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
                      <Form.Label>Price (ETH)</Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={editFormData.price}
                        readOnly
                        style={{ backgroundColor: "#e9ecef" }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantity</Form.Label>
                      <Form.Control
                        type="number"
                        name="quantity"
                        value={editFormData.quantity}
                        style={{ backgroundColor: "#e9ecef" }}
                        readOnly
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