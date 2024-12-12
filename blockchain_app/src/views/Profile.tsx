import React, { useState, useEffect } from "react";
import { BrowserProvider, formatEther, ethers } from "ethers";
import { Button, Card, Row, Spinner, Container, Col} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import NavBar from "../component/NavigationBar";
import { getNFTMetadata } from '../utils/pinata';
import MarketplaceData from "../utils/Marketplace.json";
import { NFT } from "../interfaces/INFT";

const avatar = "https://avatars.githubusercontent.com/u/59228569";


const Profile: React.FC = () => {
  const [data, setData] = useState<{address: string; balance: string | null;}>({
    address: "",
    balance: null,
  });
  const [connected, setConnected] = useState(false);
  const [myNFTs, setMyNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const connectWallet = async () => {
    if (!connected) {
      if (!window.ethereum) {
        alert("MetaMask not installed");
        return;
      }
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setData({...data, address});
      await getBalance(address);
      setConnected(true);
    } else {
      setData({ address: "", balance: null });
      setConnected(false);
    }
  };

  const getBalance = async (address: string) => {
    try {
      const provider = new BrowserProvider(window.ethereum!);
      const balance = await provider.getBalance(address);
      setData((prev) => ({ ...prev, balance: formatEther(balance)}));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchOwnedTokens = async (userAddress: string) => {
    const provider = new BrowserProvider(window.ethereum!);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(MarketplaceData.address, MarketplaceData.abi, signer);
    const tokenIds = await contract.getOwnedTokens(userAddress);

    const ownedTickets: NFT[] = [];

    for (const tokenId of tokenIds) {
      try {
        const tokenDetails = await contract.getTokenDetails(tokenId);
        const tokenURI = await contract.tokenURI(tokenId);
        const cid = tokenURI.replace("ipfs://", "");
        const result = await getNFTMetadata(cid);

        if (result.success && result.metadata) {
          const metadata = result.metadata;

          const imageUrl = metadata.image?.startsWith("ipfs://")
            ? `https://gateway.pinata.cloud/ipfs/${metadata.image.replace("ipfs://", "")}`
            : metadata.image || "";

          const ticket: NFT = {
            tokenId,
            minter: tokenDetails.minter,
            seller: tokenDetails.seller,
            image: imageUrl,
            name: tokenDetails.name || "Unnamed Event",
            description: metadata.keyValues?.description || tokenDetails.description || "No description provided",
            price: parseFloat(
              ethers.formatUnits(tokenDetails.price?.toString() || "0", "ether")
            ),
            eventDate: metadata.keyValues?.date || "Unknown",
            location: metadata.keyValues?.location || "Unknown",
            currentlyListed: tokenDetails.currentlyListed
          };

          ownedTickets.push(ticket);
        }
      } catch (error) {
        console.error(`Error fetching metadata for tokenId ${tokenId}:`, error);
      }
    }
    return ownedTickets;
  };

  const fetchMintedTokens = async (userAddress: string) => {
    const provider = new BrowserProvider(window.ethereum!);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(MarketplaceData.address, MarketplaceData.abi, signer);
    return contract.getMintedTokens(userAddress);
  };

  const loadProfileData = async () => {
    setLoading(true);
    try {
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
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const [ownedTickets, mintedTokenIds] = await Promise.all([
        fetchOwnedTokens(userAddress),
        fetchMintedTokens(userAddress)
      ]);

      // mintedTokenIds are numbers of tokens minted by the user
      // Filter out minted tokens from ownedTickets
      const filtered = ownedTickets.filter(ticket => !mintedTokenIds.map((id:any)=>id.toNumber()).includes(ticket.tokenId));

      setMyNFTs(filtered);
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  return (
    <>
      <NavBar/>
      <Container fluid='md' style={{padding:0, marginTop:10}}>
      {loading ? (
        <>
          <Spinner animation="border" variant="primary" />
          <p>Loading token details...</p>
        </>
      ) : (
        <>
          <Row className="mb-4">
            <Col>
              <Card style={{ width: "24rem" }} className="shadow">
                <Card.Header className="text-center text-white">
                  <img src={avatar} style={{width:200,height:200,borderRadius:"25%"}} alt="profile"/>
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
            </Col>
          </Row>
          <Row>
            {myNFTs.length > 0 ? (
              myNFTs.map((nft: NFT, idx: number) => (
                <Col md={4} key={idx} className="mb-4">
                  <Card>
                    <Card.Img
                      variant="top"
                      src={nft.image}
                      style={{
                        width: "100%",
                        height: "300px",
                        objectFit: "cover",
                        borderTopLeftRadius: "5px",
                        borderTopRightRadius: "5px",
                      }}
                    />
                    <Card.Body>
                      <Card.Title>{nft.name}</Card.Title>
                      <Card.Text>{nft.description}</Card.Text>
                      <Card.Text><strong>Date:</strong> {nft.eventDate}</Card.Text>
                      <Card.Text><strong>Location:</strong> {nft.location}</Card.Text>
                      <Card.Text><strong>Price:</strong> {nft.currentlyListed ? `${nft.price} ETH` : "Not Listed"}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <div className="text-center">
                <p>You have no tickets here.</p>
              </div>
            )}
          </Row>
        </>
      )}
      </Container>
    </>
  );
};

export default Profile;
