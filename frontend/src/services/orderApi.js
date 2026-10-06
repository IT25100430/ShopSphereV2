const API_BASE = 'http://localhost:5000/api';

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('shopSphereToken');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (res) => {
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP Error ${res.status}`);
  return data;
};

export const orderApi = {
  getCart: async () => {
    const res = await fetch(`${API_BASE}/cart`, { headers: getHeaders() });
    return handleResponse(res);
  },

  addToCart: async (productId, quantity = 1) => {
    const res = await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    return handleResponse(res);
  },

  updateCartItem: async (itemId, quantity) => {
    const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ quantity }),
    });
    return handleResponse(res);
  },

  removeFromCart: async (itemId) => {
    const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getOrders: async () => {
    const res = await fetch(`${API_BASE}/orders`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getOrder: async (id) => {
    const res = await fetch(`${API_BASE}/orders/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createOrder: async (orderData) => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    return handleResponse(res);
  },

  updateOrderStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  updateOrderDelivery: async (id, deliveryData) => {
    const res = await fetch(`${API_BASE}/orders/${id}/delivery`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(deliveryData),
    });
    return handleResponse(res);
  },

  cancelOrder: async (id, reason = 'Customer requested cancellation') => {
    const res = await fetch(`${API_BASE}/orders/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  }
};
