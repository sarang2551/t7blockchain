import React from "react";
import { Card, Button } from "react-bootstrap";
import { ListedToken } from "../interfaces/ListedToken";
import ListedTokenCardProps from "../interfaces/IListedTokenCard"

const NFTCard: React.FC<ListedTokenCardProps> = ({ token, onBuy }) => {
  return (
    <Card style={{ width: "18rem", marginBottom: "1rem" }}>
      <Card.Img variant="top" src={token.image} alt={token.eventName} />
      <Card.Body>
        <Card.Title>{token.eventName}</Card.Title>
        <Card.Text>
          <strong>Description:</strong> {token.description}
        </Card.Text>
        <Card.Text>
          <strong>Date:</strong> {token.date}
        </Card.Text>
        <Card.Text>
          <strong>Location:</strong> {token.location}
        </Card.Text>
        <Card.Text>
          <strong>Price:</strong> {token.price} ETH
        </Card.Text>
        <Card.Text>
          <strong>Status:</strong> {token.status}
        </Card.Text>
        <Button variant="primary" onClick={onBuy}>
          Buy Token
        </Button>
      </Card.Body>
    </Card>
  );
};

export default NFTCard;