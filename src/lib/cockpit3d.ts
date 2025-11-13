// src/lib/cockpit3d.ts
// CockPit3D API Client

const COCKPIT3D_BASE_URL = process.env.COCKPIT3D_BASE_URL || 'https://api.cockpit3d.com';
const COCKPIT3D_USERNAME = process.env.COCKPIT3D_USERNAME;
const COCKPIT3D_PASSWORD = process.env.COCKPIT3D_PASSWORD;

let authToken: string | null = null;
let tokenExpiry: number | null = null;

async function authenticate() {
  const response = await fetch(`${COCKPIT3D_BASE_URL}/rest/V2/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: COCKPIT3D_USERNAME,
      password: COCKPIT3D_PASSWORD
    })
  });

  if (!response.ok) throw new Error('Authentication failed');
  
  // API returns a plain string token wrapped in quotes
  const tokenString = await response.text();
  authToken = tokenString.replace(/"/g, '');
  tokenExpiry = Date.now() + 3600000; // 1 hour
  
  return authToken;
}

async function getToken() {
  if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
    return authToken;
  }
  return authenticate();
}

export async function getCatalog() {
  const token = await getToken();
  
  const response = await fetch(`${COCKPIT3D_BASE_URL}/rest/V2/catalog`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Failed to fetch catalog');
  
  return response.json();
}

export async function getProducts() {
  const token = await getToken();
  
  const response = await fetch(`${COCKPIT3D_BASE_URL}/rest/V2/products`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Failed to fetch products');
  
  return response.json();
}

export async function createOrder(orderData: any) {
  const token = await getToken();
  
  const response = await fetch(`${COCKPIT3D_BASE_URL}/rest/V2/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) throw new Error('Failed to create order');
  
  return response.json();
}