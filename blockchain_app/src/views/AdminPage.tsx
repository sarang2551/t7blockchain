import React, { useState, useEffect } from "react";
import NavBar from "../component/NavigationBar";
import {
  Container,
  Form,
  Button,
  Table,
  Row,
  Col,
  Spinner,
  Alert,
} from "react-bootstrap";
import { ethers, BrowserProvider } from "ethers";
import MarketplaceData from "../utils/Marketplace.json";

const AdminPage = () => {
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminAddress, setAdminAddress] = useState("");

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "address") setAddress(value);
    if (name === "label") setLabel(value);
  };

  // Whitelist an address
  const handleWhitelist = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const transaction = await contract.whitelistAddress(address, label);
      await transaction.wait();

      alert("Address successfully whitelisted!");
      setAddress("");
      setLabel("");
      fetchWhitelist();
    } catch (error) {
      console.error("Error whitelisting address:", error);
      alert("Failed to whitelist the address.");
    }
    setLoading(false);
  };

  // Remove address from the whitelist
  const handleUnwhitelist = async (address: string) => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const transaction = await contract.unwhitelistAddress(address);
      await transaction.wait();

      alert("Address successfully removed from the whitelist!");
      fetchWhitelist();
    } catch (error) {
      console.error("Error removing address:", error);
      alert("Failed to remove the address.");
    }
    setLoading(false);
  };

  // Fetch the whitelist from the contract
  const fetchWhitelist = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const currentWhitelist = await contract.getWhitelistedAddresses();
      setWhitelist(
        currentWhitelist[0].map((addr: string, idx: number) => ({
          address: addr,
          label: currentWhitelist[1][idx],
        }))
      );

      const currentAdmin = await contract.owner();
      setAdminAddress(currentAdmin);
    } catch (error) {
      console.error("Error fetching whitelist:", error);
      alert("Failed to load whitelist.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWhitelist();
  }, []);

  return (
    <div>
      <NavBar />
      <Container className="mt-4">
        <h1>Admin Page - Manage Whitelist</h1>

        {loading && <Spinner animation="border" />}

        {adminAddress && (
          <Alert variant="info">
            <strong>Contract Owner Address:</strong> {adminAddress}
          </Alert>
        )}

        <Row className="mt-4">
          <Col md={6}>
            <h4>Add Address to Whitelist</h4>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter wallet address"
                  name="address"
                  value={address}
                  onChange={handleInputChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Label</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter label (e.g., artist name)"
                  name="label"
                  value={label}
                  onChange={handleInputChange}
                />
              </Form.Group>

              <Button
                variant="primary"
                onClick={handleWhitelist}
                disabled={loading || !address || !label}
              >
                {loading ? <Spinner animation="border" size="sm" /> : "Add to Whitelist"}
              </Button>
            </Form>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col>
            <h4>Current Whitelisted Addresses</h4>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Address</th>
                  <th>Label</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {whitelist.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center">
                      No whitelisted addresses found.
                    </td>
                  </tr>
                ) : (
                  whitelist.map((entry, index) => (
                    <tr key={entry.address}>
                      <td>{index + 1}</td>
                      <td>{entry.address}</td>
                      <td>{entry.label}</td>
                      <td>
                        <Button
                          variant="danger"
                          onClick={() => handleUnwhitelist(entry.address)}
                          disabled={loading}
                        >
                          {loading ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            "Remove"
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminPage;
