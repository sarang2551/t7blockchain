import { useState, useEffect } from "react";
import { Navbar, Container, Nav, Spinner } from "react-bootstrap";
import { ethers, BrowserProvider } from "ethers";
import MarketplaceData from "../utils/Marketplace.json";

const NavBar = () => {
  const [connected, setConnected] = useState(false); // Tracks wallet connection status
  const [walletAddress, setWalletAddress] = useState(""); // Stores connected wallet address
  const [isOwner, setIsOwner] = useState(false); // Checks if the wallet is the contract owner
  const [loading, setLoading] = useState(true); // Tracks owner-check loading state

  // Function to connect the wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed. Please install it to use this feature.");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWalletAddress(address);
      setConnected(true);
      console.log("Connected Wallet Address:", address);
      await checkOwner(address); // Check if connected wallet is the owner
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect to wallet. Please try again.");
    }
  };

  // Disconnect the wallet
  const disconnectWallet = () => {
    setConnected(false);
    setWalletAddress("");
    setIsOwner(false);
  };

  // Check if the connected wallet is the contract owner
  const checkOwner = async (address: string) => {
    try {
      if (!window.ethereum) {
        console.error("MetaMask not found!");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const ownerAddress = await contract.owner();
      console.log("Owner Address:", ownerAddress);
      setIsOwner(address.toLowerCase() === ownerAddress.toLowerCase());
    } catch (error) {
      console.error("Error checking owner:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (window.ethereum) {
          const provider = new BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();

          if (accounts.length > 0) {
            const address = String(accounts[0].address);
            setWalletAddress(address);
            setConnected(true);
            console.log("Previously Connected Wallet Address:", address);
            await checkOwner(address);
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, []);

  return (
    <Navbar collapseOnSelect expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand href="/" style={{ marginLeft: "80px" }}>
          Ticket DApp
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto"></Nav>
          <Nav>
            <Nav.Link href="#features">Explore</Nav.Link>
            <Nav.Link href="/sell">Sell</Nav.Link>
            <Nav.Link href="/myTickets">My Tickets</Nav.Link>
            <Nav.Link href="#Profile">Profile</Nav.Link>

            {!loading && isOwner && (
              <Nav.Link href="/admin">Admin</Nav.Link>
            )}

            <Nav.Link
              onClick={connected ? disconnectWallet : connectWallet}
              className={`${
                connected ? "bg-green-500" : "bg-blue-500"
              } text-grey font-bold py-2 px-4 rounded-md cursor-pointer hover:bg-opacity-75`}
              style={{ textAlign: "center" }}
            >
              {connected ? (
                `${walletAddress.substring(0, 6)}...${walletAddress.substring(
                  walletAddress.length - 4
                )}`
              ) : (
                "Sign In"
              )}
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
