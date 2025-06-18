import React, { useRef, useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { gsap } from 'gsap';

// import { Truck, ShoppingBag, ImageUp, Gem } from 'lucide-react'; 
import { SEOHead } from '../components/common/SEOHead';
import { PageLayout } from '../components/layout/PageLayout';

import { products } from '../data/products';
import { ProductCard } from '../components/product/ProductCard';
import { CategoryNav } from '../components/layout/CategoryNav';
import { ContactCTA } from '../components/layout/ContactCTA';
import { ProcessSection } from '../components/layout/ProcessSection';
import { getImagePath } from '../utils/imageUtils';

import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/autoplay';

// import required modules
import { EffectCards, Autoplay } from 'swiper/modules';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
// gsap.registerPlugin();
export function Home({ product }) {

	const heroRef = useRef(null);

	useEffect(() => {
		if (typeof window !== 'undefined') {
	    gsap.registerPlugin(ScrollTrigger);
	  }

	  // Split text into words for animation
	  const headlineText = document.querySelector('.hero h1');
	  if (headlineText) {
	    const words = headlineText.textContent.split(' ');
	    headlineText.innerHTML = '';
	    
	    words.forEach(word => {
	      const span = document.createElement('span');
	      span.className = 'animate-word';
	      span.textContent = word + ' ';
	      headlineText.appendChild(span);
	    });
	    
	    gsap.from('.animate-word', {
	      opacity: 0,
	      y: 20,
	      rotation: 5,
	      duration: 0.8,
	      stagger: 0.1
	    });
	  }
 
    // Your hero section parallax effect
    // gsap.to('.hero-image', {
    //   scrollTrigger: {
    //     trigger: '.hero',
    //     start: "top top",
    //     end: "bottom top",
    //     scrub: true
    //   },
    //   y: -5,
    //   scale: 1.05,
    //   ease: "none"
    // });

    // Add more animations as needed
    
    return () => {
      // Cleanup
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);


  return (
  	<PageLayout 
      pageTitle="3D Crystals from CrystalKeepsakes - 3D Crystal Memories"
      pageDescription="Learn about our precision 3D crystal engraving process and our commitment to preserving your memories in crystal."
      className="home"
    >

    <section className="hero py-4">
      <Container>
        <Row className="align-items-center mt-4 mb-3">
          <div className="hero-content col-12 col-sm-12 col-md-6 col-lg-5">
            <h1 className="display-4 mb-4">Memories Preserved in Crystal</h1>
            <p className="lead mb-4">
              Transform your cherished photos into stunning 3D crystal art pieces. 
              Our precision laser technology creates beautiful, lasting memories.
            </p>
            <div className="hero-cta">
              <Link to="/products" className="btn btn-primary btn-lg me-3">
                Browse Designs
              </Link>
              <Link to="/about" className="btn btn-outline-light btn-lg">
                Learn More
              </Link>
            </div>
          </div>
          <div className="hero-image col-12 col-sm-12 col-md-6 col-lg-7">
          		<Swiper
				        effect={'cards'}
				        grabCursor={true}
				        modules={[EffectCards, Autoplay]}
				        cardsEffect={{
					        slideShadows: false,
					        rotate: true,
					        perSlideRotate: 3,
					        perSlideOffset: 6,
					      }}
				        initialSlide={0}
					      speed={800}
					      preventClicks={true}
					      preventClicksPropagation={true}
					      // onRealIndexChange={(swiper) => {
							  //   // Disable touch move after slide changes
							  //   swiper.allowTouchMove = false;
							  //   swiper.unsetGrabCursor();
							  // }}
							  onTouchEnd={(swiper) => {
							    // Re-enable touch move after touch ends
							    swiper.allowTouchMove = true;
							  }}
							  autoplay={{
					        delay: 3500, // Delay between transitions (in ms)
					        disableOnInteraction: false, // Continue autoplay after user interaction
					        pauseOnMouseEnter: true, // Optional: pause on mouse hover
					      }}
				        className="mySwiper"
				      >
				        <SwiperSlide>
					        <img 
	                src={getImagePath('img/products/brooks-memorial.jpg')} 
	                alt="3D Crystal Art Example" 
	                className="img-fluid rounded"
		              />
		              <span className="slide-text">Optional Text 1</span>
	              </SwiperSlide> 
	              <SwiperSlide>
					        <img 
	                src={getImagePath('img/noahs-keepsake-1.png')} 
	                alt="3D Crystal Art Example" 
	                className="img-fluid rounded"
		              />
		              <span className="slide-text">Optional Text 2</span>
	              </SwiperSlide> 
	              <SwiperSlide>
					        <img 
	                src={getImagePath('img/products/lalena-gift-square.jpg')} 
	                alt="3D Crystal Art Example" 
	                className="img-fluid rounded"
		              />
		              <span className="slide-text">Optional Text 3</span>
	              </SwiperSlide>	              
				      </Swiper>
            {/*<div className="crystal-showcase">
            	
              <img 
                src={getImagePath('img/products/3d-rectangle-wide.jpg')} 
                alt="3D Crystal Art Example" 
                className="img-fluid rounded crystal-hero-image"
              />
              <div className="crystal-glow"></div>
            </div>*/}
          </div>
        </Row>
      </Container>
    </section>


	   {/* Featured Products */}
	  <section  className="featured-products context-dark py-5">
	    <Container>
	      <h2 className="section-title text-center mb-4">Popular Crystal Designs</h2>
	      <Row>
	        {products.slice(0, 3).map(product => (
	          <Col key={product.id} md={4} className="mb-4">
	            <ProductCard product={product} />
	          </Col>
	        ))}
	      </Row>
	      <div className="text-center mt-4">
	        <Link to="/products" className="btn btn-primary btn-lg">
	          View All Designs
	        </Link>
	      </div>
	    </Container>
	  </section>

	  {/* Category Type */}
    <CategoryNav />
    {/* Process Section */}
    <ProcessSection />   

    {/* About Preview Section */}
	 	<section className="about-preview context-dark py-5">
	 		<Container>
	      <Row className="align-items-center">
	        <Col md={8}>
	          <h2>Crafted with Precision</h2>
	          <p className="lead">Perfect for anniversaries, graduations, birthdays, weddings, and memorials, each piece is crafted to showcase memories in stunning, light-catching detail.</p>
	          <p>CrystalKeepsakes isn’t just a company delivering exceptional products and services. We’re a team of dedicated individuals with one shared mission: to make your experience unforgettable. From graphic designers and production technicians to customer support specialists, everyone at CrystalKeepsakes is committed to helping you create the perfect 3D crystal, from start to finish.</p>
	          <p>Think of our website as an extension of our team, here to guide you through the process even when we’re not available in person. Have questions? Check out our FAQ page or reach out to us directly. We’re here to help!</p>
	        </Col>
	        <Col md={4}>
	          <div className="text-center"> 
	           <img src={getImagePath('img/noahs-keepsake-1.png')} className="img-fluid rounded-4 shadow" alt="" />        
	          </div>
	        </Col>
	      </Row>
	    </Container> 
    </section>

    <ContactCTA />

  </PageLayout>
  )
}