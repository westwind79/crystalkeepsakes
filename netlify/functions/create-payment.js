// netlify/functions/create-payment.js
const { Client, Environment } = require('square');

// Initialize Square client
const client = new Client({
  accessToken: process.env.VITE_SQUARE_ACCESS_TOKEN,
  environment: process.env.VITE_SQUARE_ENVIRONMENT === 'production' 
    ? Environment.Production 
    : Environment.Sandbox
});

exports.handler = async function(event, context) {
  try {
    // Method validation
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Parse and validate cart data
    const { cartItems } = JSON.parse(event.body);
    
    if (!cartItems || !cartItems.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid cart data' })
      };
    }

    // Format items for Square
    const lineItems = cartItems.map(item => ({
      name: item.name,
      quantity: "1",
      base_price_money: {
        amount: Math.round(item.price * 100), // Convert to cents
        currency: "USD"
      }
    }));

    // Create payment link
    const response = await client.checkoutApi.createPaymentLink({
      checkout_options: {
        allow_tipping: false,
        redirect_url: `${process.env.VITE_SITE_URL}/order-confirmation`,
        ask_for_shipping_address: true,
        merchant_support_email: "support@crystalkeepsakes.com"
      },
      payment_note: "Custom Crystal Order",
      pre_populated_data: {
        buyer_email: "",
      },
      order: {
        location_id: process.env.VITE_SQUARE_LOCATION_ID,
        line_items: lineItems
      }
    });

    console.log('Square API Response:', response);

    return {
      statusCode: 200,
      body: JSON.stringify({
        payment_link: response.result.payment_link
      })
    };
  } catch (error) {
    console.error('Square API Error:', error);
    
    // Handle specific Square API errors
    if (error.statusCode === 401) {
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          error: 'Unauthorized access to payment service'
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create payment link',
        details: error.message
      })
    };
  }
};