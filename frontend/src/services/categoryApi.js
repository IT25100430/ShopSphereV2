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

export const categoryApi = {
  getCategories: async (includeInactive = false) => {
    const res = await fetch(`${API_BASE}/categories?include_inactive=${includeInactive}`, { headers: getHeaders() });
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
  }
};
