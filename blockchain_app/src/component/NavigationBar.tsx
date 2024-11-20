import React from "react";
import { Link } from "react-router-dom";
import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";

const NavBar = () => {
  return (
    <Navbar collapseOnSelect expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand href="/" style={{ marginLeft: "80px" }}>
          Ticket DApp
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto"></Nav>
          <Nav>
            <Nav.Link href="#features">Explore</Nav.Link>
            <Nav.Link href="/sell">Sell</Nav.Link>
            <Nav.Link href="#myTickets">My Tickets</Nav.Link>
            <Nav.Link href="#profile">Sign In</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
