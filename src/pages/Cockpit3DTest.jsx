// pages/Cockpit3DTest.jsx
import { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { PageLayout } from '../components/layout/PageLayout';
import { ProductCard } from '../components/product/ProductCard';

// Sample of your Cockpit3D data (just a few products)
const sampleCockpit3DData = [
  {
    "id": "104",
    "name": "Cut Corner Diamond",
    "sku": "Cut_Corner_Diamond",
    "photo": "/cache/ac78e46d430b2c12ed1f3d802ac9e718/C/u/Cut_Corner.jpg",
    "price": "70",
    "options": [
      {
        "name": "Size",
        "required": true,
        "values": [
          {"name": "Cut Corner Diamond (5x5cm)", "change_qty": 0},
          {"name": "Cut Corner Diamond (6x6cm)", "change_qty": 20}
        ]
      }
    ]
  },
  {
    "id": "156",
    "name": "Heart Keychain", 
    "sku": "Heart_Keychain",
    "photo": "/cache/ac78e46d430b2c12ed1f3d802ac9e718/h/e/heartkc.png",
    "price": "55",
    "options": []
  },
  {
    "id": "105",
    "name": "Lightbase Rectangle",
    "sku": "Lightbase_Rectangle", 
    "photo": "/cache/ac78e46d430b2c12ed1f3d802ac9e718/r/e/rect_light_base_1.jpg",
    "price": "25",
    "options": []
  }
];

// Simple mapper function
function mapCockpit3DProduct(cockpitProduct) {
  const requiresImage = !cockpitProduct.name.toLowerCase().includes('lightbase');
  
  return {
    id: parseInt(cockpitProduct.id),
    name: cockpitProduct.name,
    slug: cockpitProduct.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    basePrice: parseFloat(cockpitProduct.price),
    categories: ["home-decor"], // Simple default
    description: `Beautiful ${cockpitProduct.name} crystal creation`,
    shortDescription: `Custom ${cockpitProduct.name} for your memories`,
    images: [{
      id: '1',
      src: `/img/products/cockpit3d_${cockpitProduct.id}.jpg`,
      isMain: true
    }],
    sizes: cockpitProduct.options
      .filter(opt => opt.name.toLowerCase().includes('size'))
      .flatMap(opt => opt.values || [])
      .map(val => ({
        id: val.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: val.name,
        price: val.change_qty || 0,
        faces: '1-2'
      })),
    backgroundOptions: [
      { id: 'rm', name: 'Remove Backdrop', price: 0 },
      { id: '2d', name: '2D Backdrop', price: 12 }
    ],
    lightBases: [
      { id: 'none', name: 'No Base', price: 0 },
      { id: 'standard', name: 'Standard LED Base', price: 25 }
    ],
    requiresImage: requiresImage,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Text', price: 9.50 }
    ]
  };
}

export function Cockpit3DTest() {
  const [mappedProducts, setMappedProducts] = useState([]);
  const [viewRaw, setViewRaw] = useState(false);

  useEffect(() => {
    const mapped = sampleCockpit3DData.map(mapCockpit3DProduct);
    setMappedProducts(mapped);
  }, []);

  return (
    <PageLayout 
      pageTitle="Cockpit3D Test Products"
      pageDescription="Testing Cockpit3D product mapping"
      className="cockpit3d-test"
    >
      <Container>
        <Row className="mb-4">
          <Col>
            <h1>Cockpit3D Product Test</h1>
            <p>Showing {mappedProducts.length} mapped products</p>
            
            <Button 
              variant={viewRaw ? "secondary" : "primary"}
              onClick={() => setViewRaw(!viewRaw)}
              className="mb-3"
            >
              {viewRaw ? "Show Mapped" : "Show Raw Data"}
            </Button>
          </Col>
        </Row>

        {viewRaw ? (
          <Row>
            <Col>
              <pre style={{fontSize: '12px', background: '#f8f9fa', color: '#222', padding: '1rem'}}>
                {JSON.stringify(sampleCockpit3DData, null, 2)}
              </pre>
            </Col>
          </Row>
        ) : (
          <Row>
            {mappedProducts.map(product => (
              <Col key={product.id} md={4} className="mb-4">
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}

        <Row className="mt-4">
          <Col>
            <h3>Mapping Notes:</h3>
            <ul>
              <li>Images mapped to: /img/products/cockpit3d_[ID].jpg</li>
              <li>Sizes extracted from Cockpit3D options</li>
              <li>Default backgrounds and light bases added</li>
              <li>Products requiring images auto-detected</li>
            </ul>
          </Col>
        </Row>
      </Container>
    </PageLayout>
  );
}