import React, { useState } from "react";
import { Col, Row, Carousel, Image, Button } from "react-bootstrap";
import { CarouselProps } from "../interfaces/ICarousel";
const PartyTimeImage = require("../assets/partyTime.jpg");
const ImagineDragons = require("../assets/imagine_dragons.jpg")
import {useNavigate} from 'react-router-dom'

const CarouselShow = (props:CarouselProps) => {
    const {nftList} = props
    const navigate = useNavigate();
    const navigateToPurchasePage = (id:number) => {
      navigate(`/purchase/${id}`)
    }
    return ( 
    <Carousel variant="dark" interval={2000}>
      {nftList.map((item: NFT) => (
        <Carousel.Item key={item.tokenId}> 
          <Image
            style={{ borderRadius: 25 }}
            src={item.image}  
            alt="NFT Image"
            width={840}
            height={540}
            onClick={()=>navigateToPurchasePage(item.tokenId)}
          />
          <Carousel.Caption>
            <h3>{item.name}</h3>
            <p>{item.description?item.description:"No description"}</p>
            <Button variant="primary">Get Tickets</Button>
          </Carousel.Caption>
        </Carousel.Item>
      ))}
    </Carousel>
    )
}

export default CarouselShow;