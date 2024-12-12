import { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";
import MarketplaceData from "../utils/Marketplace.json";


const NavBar = () => {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert(
          "MetaMask is not installed. Please install it to use this feature."
        );
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWalletAddress(address);
      setConnected(true);
      console.log("Connected Wallet Address:", address);
      await checkOwner(address);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect to wallet. Please try again.");
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setWalletAddress("");
    setIsOwner(false);
  };

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
    <header className="bg-white shadow">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Brand Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center">
              <img 
                src="../../logo.png"  
                alt="Ticket DApp Logo" 
                className="h-12 w-auto"       
              />
            </a>
          </div>

          {/* Menu for Larger Screens */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            <a
              href="/"
              className="text-base font-medium text-gray-700 transition hover:text-mediumBlue"
            >
              Explore
            </a>
            <a
              href="/sell"
              className="text-base font-medium text-gray-700 transition hover:text-mediumBlue"
            >
              Sell
            </a>
            <a
              href="/myTickets"
              className="text-base font-medium text-gray-700 transition hover:text-mediumBlue"
            >
              My Tickets
            </a>
            <a
              href="/profile"
              className="text-base font-medium text-gray-700 transition hover:text-mediumBlue"
            >
              Profile
            </a>
            {!loading && isOwner && (
              <a
                href="/admin"
                className="text-base font-medium text-gray-700 transition hover:text-mediumBlue"
              >
                Admin
              </a>
            )}
          </div>

          {/* Connect/Disconnect Button */}
          <button
            onClick={connected ? disconnectWallet : connectWallet}
            className={`${
              connected ? "bg-green-500" : "bg-blue-500"
            } text-white font-semibold px-4 py-2 rounded-md hover:bg-opacity-75`}
          >
            {connected
              ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(
                  walletAddress.length - 4
                )}`
              : "Sign In"}
          </button>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="inline-flex p-2 text-black transition-all duration-200 rounded-md lg:hidden focus:bg-gray-100 hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 8h16M4 16h16"
              />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default NavBar;
