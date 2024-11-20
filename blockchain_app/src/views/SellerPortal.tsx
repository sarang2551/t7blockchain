import React, { useState } from "react";
import NavBar from "../component/NavigationBar";
import { Form, Button, Table, Container, Row, Col } from "react-bootstrap";

const SellerPortal = () => {
  const [formData, setFormData] = useState({
    eventName: "",
    date: "",
    location: "",
    price: "",
    quantity: "",
  });

  const [tickets, setTickets] = useState<any[]>([]); // List of tickets created by the seller

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreateListing = () => {
    // Mimic creating a ticket and adding to the table
    const newTicket = {
      ...formData,
      id: tickets.length + 1,
      status: "Available",
    };
    setTickets([...tickets, newTicket]);
    setFormData({
      eventName: "",
      date: "",
      location: "",
      price: "",
      quantity: "",
    });
  };

  return (
    <div>
      <NavBar />
      <Container className="mt-4">
        <h1>Seller's Portal</h1>

        {/* Form for Minting Tickets */}
        <Row className="mt-4">
          <Col md={6}>
            <h4>Create a New Event</h4>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Event Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter event name"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Price (ETH)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Quantity</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter ticket quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Button variant="primary" onClick={handleCreateListing}>
                Mint and List Tickets
              </Button>
            </Form>
          </Col>
        </Row>

        {/* Table of Active Listings */}
        <Row className="mt-5">
          <Col>
            <h4>My Tickets</h4>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Price (ETH)</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.id}</td>
                    <td>{ticket.eventName}</td>
                    <td>{ticket.date}</td>
                    <td>{ticket.location}</td>
                    <td>{ticket.price}</td>
                    <td>{ticket.quantity}</td>
                    <td>{ticket.status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SellerPortal;
