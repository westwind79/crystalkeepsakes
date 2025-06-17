// src/utils/cockpit3dApi.js

class Cockpit3DApi {
  constructor() {
    this.baseUrl = import.meta.env.VITE_COCKPIT3D_BASE_URL || 'https://api.cockpit3d.com';
    this.username = import.meta.env.VITE_COCKPIT3D_USERNAME;
    this.password = import.meta.env.VITE_COCKPIT3D_PASSWORD;
    this.retailerId = import.meta.env.VITE_COCKPIT3D_RETAILER_ID;
    this.token = null;
    this.tokenExpiry = null;
  }

  // Check if we have valid credentials
  hasCredentials() {
    return !!(this.username && this.password);
  }

  // Check if token is still valid
  isTokenValid() {
    return this.token && this.tokenExpiry && Date.now() < this.tokenExpiry;
  }

  // Login and get authentication token
  async login() {
    if (!this.hasCredentials()) {
      throw new Error('Missing Cockpit3D credentials. Check environment variables.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/rest/V2/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password
        })
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }

      const token = await response.text(); // Token comes as plain text, not JSON
      this.token = token.replace(/"/g, ''); // Remove quotes if present
      
      // Set token expiry (assume 1 hour for safety)
      this.tokenExpiry = Date.now() + (60 * 60 * 1000);

      console.log('Successfully authenticated with Cockpit3D');
      return this.token;
    } catch (error) {
      console.error('Cockpit3D login error:', error);
      throw error;
    }
  }

  // Ensure we have a valid token
  async ensureAuthenticated() {
    if (!this.isTokenValid()) {
      await this.login();
    }
  }

  // Make authenticated API request
  async makeRequest(endpoint, options = {}) {
    await this.ensureAuthenticated();

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Cockpit3D API request error:', error);
      throw error;
    }
  }

  // Get full catalog (categories with products)
  async getCatalog() {
    try {
      return await this.makeRequest('/rest/V2/catalog');
    } catch (error) {
      console.error('Failed to fetch catalog:', error);
      throw error;
    }
  }

  // Get products list
  async getProducts() {
    try {
      return await this.makeRequest('/rest/V2/products');
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }

  // Get specific product by ID
  async getProduct(productId) {
    try {
      return await this.makeRequest(`/rest/V2/products/${productId}`);
    } catch (error) {
      console.error(`Failed to fetch product ${productId}:`, error);
      throw error;
    }
  }

  // Create order
  async createOrder(orderData) {
    if (!this.retailerId) {
      throw new Error('Missing retailer ID. Check VITE_COCKPIT3D_RETAILER_ID environment variable.');
    }

    const orderPayload = {
      retailer_id: this.retailerId,
      ...orderData
    };

    try {
      return await this.makeRequest('/rest/V2/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  // Upload image (if they have a separate endpoint for this)
  async uploadImage(imageFile, orderId) {
    await this.ensureAuthenticated();

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('order_id', orderId);

    try {
      const response = await fetch(`${this.baseUrl}/rest/V2/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Image upload failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }

  // Get order status
  async getOrder(orderId) {
    try {
      return await this.makeRequest(`/rest/V2/orders/${orderId}`);
    } catch (error) {
      console.error(`Failed to fetch order ${orderId}:`, error);
      throw error;
    }
  }

  // Clear stored token (for logout)
  clearAuth() {
    this.token = null;
    this.tokenExpiry = null;
  }
}

// Create singleton instance
const cockpit3dApi = new Cockpit3DApi();

// Export both the class and instance
export { Cockpit3DApi };
export default cockpit3dApi;