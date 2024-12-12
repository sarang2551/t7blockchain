import React from "react";
import Card from 'react-bootstrap/Card';
import { ListedToken } from "../interfaces/ListedToken";
import ListedTokenCardProps from "../interfaces/IListedTokenCard"

const BigNFTCard: React.FC<ListedTokenCardProps> = ({ token, onBuy }) => {
  return (
    <Card style={{
        border: "none",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
      }}>
    <Card.Body>
    <Card.Text         style={{
          padding: "16px",
          background: "",
          color: "black",
          textAlign: "left",
          fontWeight: "bold",
          fontSize: "30px",
        }}>
        Featured Event: <span style={{ fontStyle: "italic" }}>{token.name}</span>
    </Card.Text>
    </Card.Body>
    <Card.Img variant="bottom" src={token.image} style={{
                    width: "100%",
                    height: "600px",
                    objectFit: "cover",
                    borderTopLeftRadius: "5px",
                    borderTopRightRadius: "5px",
                    
                  }}/>
    </Card>
  );
}

export default BigNFTCard;