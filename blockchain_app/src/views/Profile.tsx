import React, { useState, useEffect } from "react";
import { BrowserProvider, formatEther,ethers } from "ethers";
import { Button, Card, Row, Spinner, Container, Col} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import NavBar from "../component/NavigationBar";
import {useContract} from "../component/ContractContext"
import { ListedToken } from "../interfaces/ListedToken";
import NFTCard from "../component/NFTCard";
import {getNFTMetadata} from '../utils/pinata'
import CalendarComponent from "../component/CalendarComponent";
import { NFT } from "../interfaces/INFT";

const avatar = "https://avatars.githubusercontent.com/u/59228569"


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
  const { nftContract, signer, initializeContract } = useContract();
  const [myNFTs,setMyNFTs] = useState<NFT[]>([]);
  const [loading,setLoading] = useState<boolean>(true)
  const isInitialised = nftContract !== null;
  // Function to connect or disconnect the wallet
  const connectWallet = async () => {
    if (!connected) {
      try {
        // Connect the wallet using ethers.js
        if(signer){
          const _walletAddress = await signer.getAddress();

          setData((prevData) => ({
            ...prevData,
            address: _walletAddress,
          }));

          await getBalance(_walletAddress); // Fetch balance
          setConnected(true);
        }
        
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

  const retrieveMyTokens = async():Promise<NFT[]|undefined> =>{
      if(!nftContract || !signer){
        await initializeContract();
        return
      }
      const contractResponse = await nftContract.getAllNFTs(); // returns a list of token IDs owned by the msg.sender
      const contractNfts = contractResponse?.filter((obj:any)=>obj.owner.toLowerCase() === signer.address.toLowerCase())

      const parsedNFTs : NFT[] = await Promise.all(
        contractNfts?.map(async (nft:any) => {
          try {
            // Fetch token URI for metadata
            const tokenURI = await nftContract?.tokenURI(nft.tokenId);
            
            // Fetch off-chain metadata using the tokenURI
            const metadataResult = await getNFTMetadata(tokenURI.replace("ipfs://", ""));
            const offchainmetadata = metadataResult.metadata;
            // Build the image URL from IPFS
            const imageUrl = `https://gateway.pinata.cloud/ipfs/${tokenURI.replace("ipfs://", "")}`;
    
            return {
              id: nft.tokenId.toString(),
              name: offchainmetadata?.name  || "",
              description: offchainmetadata?.keyValues?.description || "No description available",
              eventDate: offchainmetadata?.keyValues?.date || "Unknown",
              location: offchainmetadata?.keyValues?.location || "Unknown",
              price: ethers.formatUnits(nft.price.toString(), "ether"),
              image: imageUrl,
              status: nft.currentlyListed
                ? "Listed"
                : nft.owner.toLowerCase() !== nft.seller.toLowerCase()
                ? "Sold"
                : "Unlisted",
            };
          } catch (error) {
            console.error(`Failed to parse NFT with tokenId ${nft.tokenId}:`, error);
            return null; // Return null or handle errors gracefully
          }
        }))

        return parsedNFTs;

    }

  useEffect(()=>{
    setLoading(true)
    if(isInitialised){
      retrieveMyTokens().then((nfts:NFT[]|undefined)=>{
        if(nfts){
          setMyNFTs(nfts)
        }
      })
    }else{
      initializeContract();
    }
    setLoading(false)
  },[isInitialised])

  return (
    <>
    <NavBar/>
    <Container fluid='md' style={{padding:0, marginTop:10}}>
    {loading ? <><Spinner animation="border" variant="primary" />
                  <p>Loading token details...</p></> : 
    <><Row className="mb-4">
      <Col>
      <Card style={{ width: "24rem" }} className="shadow">
        <Card.Header className="text-center text-white">
          <img src={avatar} style={{width:200,height:200,borderRadius:"25%"}}/>
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
      <Col>
      <CalendarComponent tokens={myNFTs}/>
      </Col>
      </Row>
      <Row>
        {myNFTs?myNFTs?.map((nft:NFT,idx:number)=>
          <NFTCard key={idx} token={nft}/>
        ) : <Col>No tickets owned</Col>}
      </Row></>}
    
    </Container>
    </>
  );
};

export default Profile;
