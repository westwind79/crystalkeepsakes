// Test script to create an order in Cockpit3D API
// Run with: node test-cockpit3d-order.js

const BASE_URL_PROD = 'https://api.cockpit3d.com';
const BASE_URL_DEV = 'https://c3d-profit-dev.host.alva.tools';

// Choose which environment to test
const BASE_URL = BASE_URL_DEV; // Change to BASE_URL_PROD for production

// Your API credentials (get from Cockpit3D)
const USERNAME = 'YOUR_USERNAME'; // Replace with your username
const PASSWORD = 'YOUR_PASSWORD'; // Replace with your password
const RETAILER_ID = 'YOUR_RETAILER_ID'; // Replace with your retailer ID

async function login() {
  console.log('🔐 Step 1: Logging in to get access token...');
  
  const response = await fetch(`${BASE_URL}/rest/V2/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${response.status} - ${error}`);
  }

  const token = await response.text();
  console.log('✅ Login successful! Token received.');
  return token.replace(/"/g, ''); // Remove quotes from token
}

async function createTestOrder(token) {
  console.log('\n📦 Step 2: Creating test order...');
  
  const orderData = {
    retailer_id: RETAILER_ID,
    address: {
      email: "test@crystalkeepsakes.com",
      firstname: "Test",
      lastname: "Customer",
      telephone: "5551234567",
      region: "CA",
      country: "US",
      staff_user: "CrystalKeepsakes Test",
      order_id: `TEST-${Date.now()}`,
      voyage_code: "TEST-VOYAGE",
      street: "123 Test Street",
      city: "Test City",
      postcode: "12345",
      shipping_method: "air",
      destination: "vendor_store"
    },
    items: [
      {
        sku: "Cut_Corner_Diamond", // Use an actual SKU from your catalog
        qty: "1",
        client_item_id: `TEST-ITEM-${Date.now()}`,
        original_photo: "https://crystalkeepsakes.com/test/img/sample-photo.jpg",
        cropped_photo: "https://crystalkeepsakes.com/test/img/sample-photo.jpg",
        special_instructions: "This is a test order from CrystalKeepsakes",
        "2d": false,
        options: [
          {
            name: "Size",
            value: "Medium"
          },
          {
            name: "Custom Text",
            value: "Test Order - Please Do Not Process"
          }
        ]
      }
    ]
  };

  console.log('Order data:', JSON.stringify(orderData, null, 2));

  const response = await fetch(`${BASE_URL}/rest/V2/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Order creation failed: ${response.status} - ${error}`);
  }

  const result = await response.json();
  console.log('✅ Order created successfully!');
  console.log('Order response:', JSON.stringify(result, null, 2));
  return result;
}

async function getOrders(token) {
  console.log('\n📋 Step 3: Fetching orders...');
  
  const response = await fetch(`${BASE_URL}/rest/V2/orders`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get orders: ${response.status} - ${error}`);
  }

  const orders = await response.json();
  console.log(`✅ Found ${orders.length} orders`);
  console.log('Recent orders:', JSON.stringify(orders.slice(0, 3), null, 2));
  return orders;
}

// Main test function
async function runTest() {
  console.log('🧪 Cockpit3D API Test\n');
  console.log(`Testing against: ${BASE_URL}\n`);
  
  // Check if credentials are set
  if (USERNAME === 'YOUR_USERNAME' || PASSWORD === 'YOUR_PASSWORD') {
    console.error('❌ ERROR: Please set your USERNAME and PASSWORD in this file first!');
    console.log('\nGet your credentials from Cockpit3D support.');
    return;
  }

  try {
    // Step 1: Login
    const token = await login();
    
    // Step 2: Create test order
    const order = await createTestOrder(token);
    
    // Step 3: Verify by fetching orders
    await getOrders(token);
    
    console.log('\n✅ TEST COMPLETE!');
    console.log('\n📝 Summary:');
    console.log(`   - Order ID: ${order.id}`);
    console.log(`   - Order Number: ${order.order_id}`);
    console.log(`   - Status: ${order.status_label}`);
    console.log(`   - Customer: ${order.customer_name}`);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
  }
}

// Run the test
runTest();
