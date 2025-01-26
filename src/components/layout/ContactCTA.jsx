import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export function ContactCTA() {
  return (
    <section className="contact-cta bg-light context-light py-5">
        <Container>
          <Row className="align-items-center align-middle text-center">
            <Col xs={12} sm={8}>
              <h2>Ready to Create Your Crystal Memory?</h2>
              <p className="lead">Contact us to discuss your custom crystal creation</p>
            </Col>
            <Col xs={12} sm={4}>        
              <Link to="/products" className="btn btn-primary btn-lg text-dark">
                 Get Started
              </Link>
            </Col>
          </Row>
        </Container> 
    </section>
  );
}