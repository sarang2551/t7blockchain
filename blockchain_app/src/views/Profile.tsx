import React, { useState } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { Button, Card } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";



const Profile: React.FC = () => {
  // useState for storing wallet address and balance
  const [data, setData] = useState<{
    address: string;
    balance: string | null;
  }>({
    address: "",
    balance: null,
  });
  const [connected, setConnected] = useState(false);

  // Function to connect or disconnect the wallet
  const connectWallet = async () => {
    if (!connected) {
      try {
        // Connect the wallet using ethers.js
        const provider = new BrowserProvider(window.ethereum!);
        const signer = await provider.getSigner();
        const _walletAddress = await signer.getAddress();

        setData((prevData) => ({
          ...prevData,
          address: _walletAddress,
        }));

        await getBalance(_walletAddress); // Fetch balance
        setConnected(true);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      // Disconnect the wallet
      setData({
        address: "",
        balance: null,
      });

      setConnected(false);
    }
  };

  // Function to fetch balance in Ether
  const getBalance = async (address: string) => {
    try {
      const provider = new BrowserProvider(window.ethereum!);
      const balance = await provider.getBalance(address);

      setData((prevData) => ({
        ...prevData,
        balance: formatEther(balance), // Format balance to Ether
      }));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      {/* Profile Card */}
      <Card style={{ width: "24rem" }} className="shadow">
        <Card.Header className="text-center bg-primary text-white">
          <h4>Profile</h4>
        </Card.Header>
        <Card.Body>
          <Card.Text>
            <strong>Address:</strong> <br />
            {data.address || "Not connected"}
          </Card.Text>
          <Card.Text>
            <strong>Balance:</strong> <br />
            {data.balance !== null ? `${data.balance} ETH` : "N/A"}
          </Card.Text>
          <Button onClick={connectWallet} variant="primary" className="w-100">
            {connected ? "Disconnect Wallet" : "Connect Wallet"}
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Profile;
