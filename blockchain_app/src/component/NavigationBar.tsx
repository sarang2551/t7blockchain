import { useState, useEffect } from "react";
import { Navbar, Container, Nav } from "react-bootstrap";
import { BrowserProvider } from "ethers";

const NavBar = () => {
  const [connected, setConnected] = useState(false); // Tracks connection status
  const [walletAddress, setWalletAddress] = useState(""); // Stores connected wallet address

  // Function to connect/disconnect the wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed. Please install it to use this feature.");
        return;
      }

      const provider = new BrowserProvider(window.ethereum); // Create a provider
      const signer = await provider.getSigner(); // Get the signer from MetaMask
      const address = await signer.getAddress(); // Fetch wallet address

      // Update the state with the wallet address
      setWalletAddress(address);
      setConnected(true);
      console.log("Connected Wallet Address:", address); // Debugging log
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect to wallet. Please try again.");
    }
  };

  // Disconnect Wallet
  const disconnectWallet = () => {
    setConnected(false);
    setWalletAddress("");
  };

  useEffect(() => {
    // Check if the wallet is already connected when the component loads
    const checkConnection = async () => {
      try {
        if (window.ethereum) {
          const provider = new BrowserProvider(window.ethereum); // Create a provider
          const accounts = await provider.listAccounts(); // Fetch the list of connected accounts
          if (accounts.length > 0) {
            setWalletAddress(String(accounts[0].address)); // Use the first connected account
            setConnected(true);
            console.log("Previously Connected Wallet Address:", accounts[0].address); // Debugging log
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
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

            {/* Wallet Connection Link */}
            <Nav.Link
              onClick={connected ? disconnectWallet : connectWallet}
              className={`${
                connected ? "bg-green-500" : "bg-blue-500"
              } text-grey font-bold py-2 px-4 rounded-md cursor-pointer hover:bg-opacity-75`}
              style={{ textAlign: "center" }}
            >
              {connected
                ? `${walletAddress.toString().substring(0, 6)}...${walletAddress.toString().substring(
                    walletAddress.length - 4
                  )}`
                : "Sign In"}
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
