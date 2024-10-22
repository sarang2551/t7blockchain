import React, { useState } from "react";
import { Col, Row, Carousel, Image, Button } from "react-bootstrap";
const PartyTimeImage = require("../assets/partyTime.jpg");
const ImagineDragons = require("../assets/imagine_dragons.jpg")

const CarouselShow = () => {
    return ( 
        <Carousel variant="dark" interval={2000}>
          <Carousel.Item>
          <Image style={{borderRadius:25}} src={PartyTimeImage} alt="First slide" width={840} height={540} />
            <Carousel.Caption>
              {/* <h3>Sarang's concert</h3>
              <p>Party Time sheeeeeeeeeeeeeesh</p> */}
              <Button variant="primary">Get Tickets</Button>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
          <Image style={{borderRadius:25}} src={ImagineDragons} alt="Second slide" />
            <Carousel.Caption>
              {/* <h3>Second slide label</h3>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p> */}
              <Button variant="primary">Get Tickets</Button>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
    )
}

export default CarouselShow;