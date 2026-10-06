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

export const brandApi = {
  getBrands: async (includeInactive = false) => {
    const res = await fetch(`${API_BASE}/brands?include_inactive=${includeInactive}`, { headers: getHeaders() });
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
  }
};
