const API_BASE = 'http://localhost:5000/api';

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('shopSphereToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const userStr = localStorage.getItem('shopSphereUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.user_id) {
          headers['Authorization'] = `Bearer mock-jwt-token-${user.user_id}-${Date.now()}`;
        }
      } catch {}
    }
  }
  return headers;
};

const handleResponse = async (res) => {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `HTTP Error ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
};

export const api = {
  // ==========================================
  // 1. PRODUCT MANAGEMENT
  // ==========================================
  getProducts: async (includeDeleted = false, categoryId = null) => {
    let url = `${API_BASE}/products?include_deleted=${includeDeleted}`;
    if (categoryId) url += `&category_id=${encodeURIComponent(categoryId)}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  getProduct: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createProduct: async (productData) => {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse(res);
  },

  updateProduct: async (id, productData) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse(res);
  },

  deleteProduct: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  restoreProduct: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}/restore`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  adjustStock: async (id, adjustment) => {
    const res = await fetch(`${API_BASE}/products/${id}/stock`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ adjustment }),
    });
    return handleResponse(res);
  },

  restoreProduct: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}/restore`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ==========================================
  // 2. CATEGORY MANAGEMENT
  // ==========================================
  getCategories: async () => {
    const res = await fetch(`${API_BASE}/categories`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getCategory: async (id) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createCategory: async (categoryData) => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(categoryData),
    });
    return handleResponse(res);
  },

  updateCategory: async (id, categoryData) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(categoryData),
    });
    return handleResponse(res);
  },

  deleteCategory: async (id) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  restoreCategory: async (id) => {
    const res = await fetch(`${API_BASE}/categories/${id}/restore`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ==========================================
  // 3. ORDER MANAGEMENT
  // ==========================================
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

  updateOrderStatus: async (id, status, staffName = null) => {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, staff_name: staffName }),
    });
    return handleResponse(res);
  },

  deleteOrder: async (id) => {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  cancelOrder: async (id, reason = 'Customer requested cancellation') => {
    return api.updateOrderStatus(id, 'CANCELLED', reason);
  },

  // ==========================================
  // 4. PROMOTIONS & DISCOUNTS MANAGEMENT
  // ==========================================
  getPromotions: async () => {
    const res = await fetch(`${API_BASE}/promotions`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getPromotion: async (id) => {
    const res = await fetch(`${API_BASE}/promotions/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createPromotion: async (promoData) => {
    const res = await fetch(`${API_BASE}/promotions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(promoData),
    });
    return handleResponse(res);
  },

  updatePromotion: async (id, promoData) => {
    const res = await fetch(`${API_BASE}/promotions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(promoData),
    });
    return handleResponse(res);
  },

  deletePromotion: async (id) => {
    const res = await fetch(`${API_BASE}/promotions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  validatePromotion: async (code, amount, email = null, userId = null) => {
    const res = await fetch(`${API_BASE}/promotions/validate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, amount, email, user_id: userId }),
    });
    return handleResponse(res);
  },

  // ==========================================
  // 5. BRAND MANAGEMENT
  // ==========================================
  getBrands: async () => {
    const res = await fetch(`${API_BASE}/brands`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getBrand: async (id) => {
    const res = await fetch(`${API_BASE}/brands/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createBrand: async (brandData) => {
    const res = await fetch(`${API_BASE}/brands`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(brandData),
    });
    return handleResponse(res);
  },

  updateBrand: async (id, brandData) => {
    const res = await fetch(`${API_BASE}/brands/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(brandData),
    });
    return handleResponse(res);
  },

  deleteBrand: async (id) => {
    const res = await fetch(`${API_BASE}/brands/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  restoreBrand: async (id) => {
    const res = await fetch(`${API_BASE}/brands/${id}/restore`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ==========================================
  // 6. CUSTOMER REVIEW & FEEDBACK MANAGEMENT
  // ==========================================
  getReviews: async (productId = null) => {
    let url = `${API_BASE}/reviews`;
    if (productId) url += `?product_id=${encodeURIComponent(productId)}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  createReview: async (reviewData) => {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reviewData),
    });
    return handleResponse(res);
  },

  updateReview: async (id, reviewData) => {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(reviewData),
    });
    return handleResponse(res);
  },

  deleteReview: async (id) => {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ==========================================
  // AUTHENTICATION & USERS
  // ==========================================
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  getUsers: async () => {
    const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // ==========================================
  // CART MANAGEMENT (DATABASE SYNCED)
  // ==========================================
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
    const res = await fetch(`${API_BASE}/cart/items/${encodeURIComponent(itemId)}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ quantity }),
    });
    return handleResponse(res);
  },

  removeCartItem: async (itemId) => {
    const res = await fetch(`${API_BASE}/cart/items/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  clearCart: async () => {
    const res = await fetch(`${API_BASE}/cart`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export default api;
