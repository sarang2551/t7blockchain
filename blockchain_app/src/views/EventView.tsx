import React, { useEffect,useState } from "react";
import {useParams} from 'react-router-dom'
import { ListedToken } from "../interfaces/ListedToken";
import MarketplaceData from "../contracts/MarketPlace.json"
import {ethers,BrowserProvider} from "ethers"
import {getNFTMetadata} from "../utils/pinata"
import {Card, Button,Container,Row,Col,Spinner} from 'react-bootstrap'
import NavBar from "../component/NavigationBar";

const EventView = () =>{

    const { tokenId } = useParams();
    const tokenIdInt = parseInt(tokenId ?? "0", 10);
      if (isNaN(tokenIdInt) || tokenIdInt <= 0) {
        alert("Invalid token ID!");
    }

    const [pageToken,setToken] = useState<ListedToken|undefined>();
    const [loading, setLoading] = useState<boolean>(true);

    const retrieveTokenDetails = async():Promise<ListedToken|undefined>=>{
        try{
            const provider = window.ethereum ? new BrowserProvider(window.ethereum) : null;
        if(!provider){
        alert("Meta mask has not been installed!")
        return
        }
        const signer = await provider.getSigner();
        const nftContract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
        );
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
            console.log(e)
        }

    }

    const handleBuyToken = async()=>{
        const provider = window.ethereum ? new BrowserProvider(window.ethereum) : null;
        if(!provider){
        alert("Meta mask has not been installed!")
        return
        }
        // const signer = await provider.getSigner();
        // const nftContract = new ethers.Contract(
        // MarketplaceData.address,
        // MarketplaceData.abi,
        // signer
        // );
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
    },[pageToken])
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
                    <Card style={{ width: "100%", marginBottom: "2rem" }}>
                      <Card.Img variant="top" src={pageToken.image} alt={pageToken.eventName} />
                      <Card.Body>
                        <Card.Title>{pageToken.eventName}</Card.Title>
                        <Card.Text>
                          <strong>Description:</strong> {pageToken.description}
                        </Card.Text>
                        <Card.Text>
                          <strong>Date:</strong> {pageToken.date} | <strong>Location:</strong>{" "}
                          {pageToken.location}
                        </Card.Text>
                        <Card.Text>
                          <strong>Price:</strong> {pageToken.price} ETH
                        </Card.Text>
                        <Card.Text>
                          <strong>Status:</strong> {pageToken.status}
                        </Card.Text>
                        <Button variant="primary" onClick={handleBuyToken}>
                          Buy Token
                        </Button>
                      </Card.Body>
                    </Card>
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