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

export const promotionApi = {
  getPromotions: async () => {
    const res = await fetch(`${API_BASE}/promotions`, { headers: getHeaders() });
    return handleResponse(res);
  },

  validatePromoCode: async (code, orderAmount, email = null) => {
    const res = await fetch(`${API_BASE}/promotions/validate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, amount: orderAmount, email }),
    });
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

  deletePromotion: async (id) => {
    const res = await fetch(`${API_BASE}/promotions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  }
};
