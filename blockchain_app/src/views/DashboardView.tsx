import React from "react";
import NavBar from "../component/NavigationBar";
import SearchBar from "../component/SearchBar";
import { Button, Card, Col, Row} from "react-bootstrap";
import CarouselShow from "../component/CarouselShow";

const DashboardView = () => {
  return (
    <div>
      <Row>
        <NavBar />
      </Row>
      <Row className="mt-4" md={12}>
        <Col className="mx-auto" md={6} >
          <SearchBar />
        </Col>
      </Row>
      <Row md={12} className="mt-4 d-flex align-items-center">
        <Col md={{offset:2,span:3}} >
        <Card>
            <Card.Header>Concert</Card.Header>
            <Card.Body><Button variant="dark">Buy Tickets!</Button></Card.Body>
        </Card>
        </Col>
        <Col md={6}>
        <CarouselShow/>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardView;