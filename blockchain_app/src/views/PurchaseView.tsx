import React, { useEffect, useState } from "react";
import {useParams} from 'react-router-dom'
import { GetIpfsUrlFromPinata } from "../utils/pinata";
import MarketplaceJSON from "../utils/Marketplace.json";
import axios from "axios";
import ethers from 'ethers'

const PurchaseView = ()=>{
    // query backend to get event data
    const params = useParams();
    const ticketId = params.id ? params.id : "";
    const [data, updateData] = useState<NFT>();
    const [dataFetched, updateDataFetched] = useState(false);
    const [message, updateMessage] = useState("");
    const [currAddress, updateCurrAddress] = useState("0x");

    async function getNFTData(tokenId:number) {
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
        //create an NFT Token
        var tokenURI = await contract.tokenURI(tokenId); // from an id to uri mapping
        const listedToken:NFT = await contract.getListedTokenForId(tokenId);
        tokenURI = GetIpfsUrlFromPinata(tokenURI);
        let meta:any = await axios.get(tokenURI);
        meta = meta.data;
        console.log(listedToken);
    
        let item : NFT = {
            price: meta.price,
            tokenId: tokenId,
            seller: listedToken.seller,
            owner: listedToken.owner,
            image: meta.image,
            name: listedToken.name,
            description: listedToken.description,
            currentlyListed: listedToken.currentlyListed
        }
        console.log(item);
        updateData(item);
        updateDataFetched(true);
        console.log("address", addr)
        updateCurrAddress(addr);
    }

    async function buyNFT(tokenId:string) {
        try {
            //After adding your Hardhat network to your metamask, this code will get providers and signers
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
    
            //Pull the deployed contract instance
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            const ticketPrice = data?.price ? data.price.toString() : "0"; 
            const salePrice = ethers.parseUnits(ticketPrice, 'ether')
            updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
            //run the executeSale function
            let transaction = await contract.executeSale(tokenId, {value:salePrice});
            await transaction.wait();
    
            alert('You successfully bought the NFT!');
            updateMessage("");
        }
        catch(e) {
            alert("Upload Error"+e)
        }
    }

    useEffect(()=>{
        if(ticketId != ""){
            var id : number = +ticketId;
            getNFTData(id)
        }
        
    },[dataFetched])

    return (
        <>
        {data??<></>}
        </>
    )
}

export default PurchaseView;