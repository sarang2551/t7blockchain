import React from "react";
import { Carousel, Image, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ICarousel } from "../interfaces/ICarousel";

const CarouselShow = ({ listedTokens }: ICarousel) => {
  const navigate = useNavigate(); // Initialize the navigate function

  const handleGetTickets = (tokenId: number) => {
    navigate(`/event/${tokenId}`); // Navigate to the event page with tokenId
  };

  return (
    <Carousel variant="dark" interval={2000}>
      {listedTokens.map((token) => (
        <Carousel.Item key={token.id}>
          <Image
            style={{ borderRadius: 25 }}
            src={token.image}
            alt={`${token.eventName} slide`}
            width={840}
            height={540}
          />
          <Carousel.Caption>
            <h3>{token.eventName}</h3>
            <p>{token.description}</p>
            <p>
              <strong>Date:</strong> {token.date} | <strong>Location:</strong> {token.location}
            </p>
            <p>
              <strong>Price:</strong> {token.price} ETH
            </p>
            <Button
              variant="primary"
              onClick={() => handleGetTickets(token.id)} // Pass tokenId to the handler
            >
              Get Tickets
            </Button>
          </Carousel.Caption>
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

export default CarouselShow;
