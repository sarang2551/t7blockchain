import React from "react";
import {InputGroup, Form, Card, Col} from 'react-bootstrap'
import {Search} from 'react-bootstrap-icons'

const SearchBar = () => {
    return (

            <InputGroup>
            <InputGroup.Text><Search/></InputGroup.Text>
            <Form.Control as="input" placeholder="Search events, artists, teams and more"/>
            </InputGroup>

    )
}

export default SearchBar;