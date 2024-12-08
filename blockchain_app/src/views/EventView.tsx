import React, { useEffect,useState } from "react";
import {useParams} from 'react-router-dom'
import { ListedToken } from "../interfaces/ListedToken";
import MarketplaceData from "../contracts/MarketPlace.json"
import {ethers,BrowserProvider} from "ethers"
import {getNFTMetadata} from "../utils/pinata"
import {Card, Button,Container,Row,Col,Spinner} from 'react-bootstrap'
import NavBar from "../component/NavigationBar";
import {useContract} from "../component/ContractContext"
import NFTCard from "../component/NFTCard";

const EventView = () =>{

    const { tokenId } = useParams();
    const tokenIdInt = parseInt(tokenId ?? "0", 10);
      if (isNaN(tokenIdInt) || tokenIdInt <= 0) {
        alert("Invalid token ID!");
    }
    const { nftContract, signer, initializeContract } = useContract();

    const [pageToken,setToken] = useState<ListedToken|undefined>();
    const [loading, setLoading] = useState<boolean>(true);

    const retrieveTokenDetails = async():Promise<ListedToken|undefined>=>{
        try{
          if (!nftContract) {
            console.log("Contract not initialized yet. Initializing...");
            await initializeContract();
            return;
          }
          const tokenDetails = await nftContract.getTokenDetails(tokenIdInt);
          const tokenURI = await nftContract.tokenURI(tokenIdInt);

          // Fetch off-chain metadata using the tokenURI
          const metadataResult = await getNFTMetadata(tokenURI.replace("ipfs://", ""));
          const offchainmetadata = metadataResult.metadata;

          // Build the image URL from IPFS
          const imageUrl = `https://gateway.pinata.cloud/ipfs/${tokenURI.replace("ipfs://", "")}`;

          // Populate and return the ListedToken object
          const listedToken:ListedToken = {
          id: tokenIdInt,
          eventName: offchainmetadata?.name || "Unknown Event",
          description: offchainmetadata?.keyValues?.description || "No description available",
          date: offchainmetadata?.keyValues?.date || "Unknown",
          location: offchainmetadata?.keyValues?.location || "Unknown",
          price: ethers.formatUnits(tokenDetails.price.toString(), "ether"),
          image: imageUrl,
          status: tokenDetails.currentlyListed
              ? "Listed"
              : tokenDetails.owner.toLowerCase() !== tokenDetails.seller.toLowerCase()
              ? "Sold"
              : "Unlisted",
          };
          return listedToken
        }catch(e:any){
            alert(e)
        }

    }

    const handleBuyToken = async()=>{
        
        alert("Currently not available until the cost is reduced!")
        //nftContract.executeSale(tokenIdInt)
    }

    useEffect(()=>{
        if(tokenId){
            setLoading(true)
            retrieveTokenDetails().then((nft:ListedToken|undefined)=>{setToken(nft)})
            setLoading(false)
        }else{
            alert("Page missing token Id!")
        }
    },[])
    return (
        <>
          <NavBar />
    
          <Container style={{ marginTop: "2rem" }}>
            <Row className="justify-content-center">
              <Col md={8} lg={6}>
                {loading ? (
                  <div style={{ textAlign: "center", marginTop: "2rem" }}>
                    <Spinner animation="border" variant="primary" />
                    <p>Loading token details...</p>
                  </div>
                ) : (
                  pageToken ? (
                    <NFTCard token={pageToken}/>
                  ) : <div style={{ textAlign: "center", marginTop: "2rem" }}>
                  <Spinner animation="border" variant="primary" />
                  <p>Loading token details...</p>
                </div>
                )}
              </Col>
            </Row>
          </Container>
        </>
      );
};


export default EventView;