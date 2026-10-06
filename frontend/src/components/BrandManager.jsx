import React, { useState, useEffect } from 'react';
import { brandApi } from '../services/brandApi';

export default function BrandManager() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form, setForm] = useState({ brand_name: '', origin: '', description: '' });

  const loadBrands = async () => {
    setLoading(true);
    try {
      const data = await brandApi.getBrands(true);
      setBrands(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBrands(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await brandApi.updateBrand(editingBrand.brand_id, form);
      } else {
        await brandApi.createBrand(form);
      }
      setShowModal(false);
      setEditingBrand(null);
      setForm({ brand_name: '', origin: '', description: '' });
      loadBrands();
    } catch (err) {
      alert('Error saving brand: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🏷️ Official Brand Partners Hub</h2>
        <button 
          onClick={() => { setEditingBrand(null); setForm({ brand_name: '', origin: '', description: '' }); setShowModal(true); }}
          style={{ padding: '10px 18px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          + Add New Brand
        </button>
      </div>

      {loading ? <p>Loading brands...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <thead>
            <tr style={{ background: '#f0f9ff', borderBottom: '2px solid #bae6fd', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Brand Name</th>
              <th style={{ padding: '12px' }}>Origin Country</th>
              <th style={{ padding: '12px' }}>Description</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map(b => (
              <tr key={b.brand_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{b.brand_name}</td>
                <td style={{ padding: '12px' }}>{b.origin || 'International'}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>{b.description}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', background: b.is_active ? '#e0f2fe' : '#fee2e2', color: b.is_active ? '#0369a1' : '#b91c1c' }}>
                    {b.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => { setEditingBrand(b); setForm({ brand_name: b.brand_name, origin: b.origin || '', description: b.description || '' }); setShowModal(true); }}
                    style={{ padding: '6px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '28px', borderRadius: '12px', width: '420px', maxWidth: '90%' }}>
            <h3>{editingBrand ? 'Edit Brand' : 'Register New Brand'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Brand Name</label>
                <input value={form.brand_name} onChange={e => setForm({ ...form, brand_name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Apple, Nike, Sony..." required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Origin Country</label>
                <input value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="USA, Japan, Germany..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Brand Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px' }} placeholder="Manufacturer profile..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save Brand</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
