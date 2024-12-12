import React from "react";
import { Card, Button } from "react-bootstrap";
import { ListedToken } from "../interfaces/ListedToken";
import ListedTokenCardProps from "../interfaces/IListedTokenCard"

const NFTCard: React.FC<ListedTokenCardProps> = ({ token, onBuy }) => {
  return (
    <Card style = {{boxShadow: '0 8px 16px rgba(202, 238, 207, 1)'}}>
      <Card.Img variant="top" src={token.image} alt={token.name} style={{
                    width: "100%",
                    height: "300px",
                    objectFit: "cover",
                    borderTopLeftRadius: "5px",
                    borderTopRightRadius: "5px",
                    
                  }}/>
      <Card.Body>
        <Card.Title>{token.name}</Card.Title>
        <Card.Text>
          <strong>Description:</strong> {token.description}
        </Card.Text>
        <Card.Text>
          <strong>Date:</strong> {token.eventDate}
        </Card.Text>
        <Card.Text>
          <strong>Location:</strong> {token.location}
        </Card.Text>
        <Card.Text>
          <strong>Price:</strong> {token.price} ETH
        </Card.Text>
        <Card.Text>
          <strong>Status:</strong> {token.currentlyListed}
        </Card.Text>
        <Button variant="primary" onClick={onBuy}>
          Buy Token
        </Button>
      </Card.Body>
    </Card>
  );
};

export default NFTCard;
