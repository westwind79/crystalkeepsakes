import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Alert, Button } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { PageLayout } from '../components/layout/PageLayout';

export function Contact() {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    comment: ''
  });

  // Form validation state
  const [errors, setErrors] = useState({});
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check session storage for previous submission
  useEffect(() => {
    const submitted = sessionStorage.getItem('contactSubmitted');
    if (submitted) {
      setHasSubmitted(true);
    }
  }, []);

  // Validation rules
  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation (optional)
    if (formData.phone.trim()) {
      const phoneRegex = /^[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }
    
    // Comment validation
    if (!formData.comment.trim()) {
      newErrors.comment = 'Message is required';
    } else if (formData.comment.length < 10) {
      newErrors.comment = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (hasSubmitted) {
      setSubmitStatus({
        type: 'warning',
        message: 'You have already submitted a message this session.'
      });
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      // First test the connection with our test endpoint
      console.log('Testing endpoint connection...');
      const response = await fetch('/api/sendContact.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      let data;
      try {
        const textResponse = await response.text();
        data = JSON.parse(textResponse);
      } catch (error) {
        console.error('Error parsing response:', error);
        throw new Error('Invalid server response');
      }
      
      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: data.message || 'Thank you for your message!'
        });
        // Mark as submitted in session storage
        sessionStorage.setItem('contactSubmitted', 'true');
        setHasSubmitted(true);
        // Clear form
        setFormData({
          name: '',
          phone: '',
          email: '',
          comment: ''
        });
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      setSubmitStatus({
        type: 'danger',
        message: error.message || 'An error occurred. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <PageLayout 
      pageTitle="Contact CrystalKeepsakes - 3D Crystal Memories"
      pageDescription="Get in touch with us about custom crystal creations and any questions."
      className="contact"
    >
      <section className="hero py-4"> 
        <div className="hero-content">
          <h1 className="primary-header">Contact Us</h1>
          <p>Questions about our crystal art? We'd love to hear from you.</p>
        </div>
      </section>

      <section className="contact-form bg-light py-5">
        <Container>
          <Row className="justify-content-center">
            <Col className="col-sm-5 mx-auto">
              {/* Status Alert */}
              {submitStatus && (
                <Alert 
                  variant={submitStatus.type}
                  dismissible 
                  onClose={() => setSubmitStatus(null)}
                  className="mb-4"
                >
                  {submitStatus.message}
                </Alert>
              )}

              {/*<Form className="contact-form" onSubmit={handleSubmit}>*/}
              <Form onSubmit={handleSubmit}>
                {/* Name Field */}
                <Form.Group className="mb-3">
                  <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    isInvalid={!!errors.name}
                    disabled={isSubmitting || hasSubmitted}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Phone Field */}
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    isInvalid={!!errors.phone}
                    disabled={isSubmitting || hasSubmitted}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Email Field */}
                <Form.Group className="mb-3">
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    disabled={isSubmitting || hasSubmitted}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Comment Field */}
                <Form.Group className="mb-4">
                  <Form.Label>Message <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    isInvalid={!!errors.comment}
                    disabled={isSubmitting || hasSubmitted}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.comment}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isSubmitting || hasSubmitted}
                >
                  {isSubmitting ? 'Sending...' : hasSubmitted ? 'Message Sent' : 'Send Message'}
                </Button>

                {/* Required Fields Note */}
                <div className="text-muted mt-2 small">
                  <span className="text-danger">*</span> Required fields
                </div>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>
    </PageLayout>
  );
}