import React, { useState, useEffect } from 'react';
import { categoryApi } from '../services/categoryApi';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ category_name: '', description: '', icon: '🏷️' });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryApi.getCategories(true);
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory.category_id, form);
      } else {
        await categoryApi.createCategory(form);
      }
      setShowModal(false);
      setEditingCategory(null);
      setForm({ category_name: '', description: '', icon: '🏷️' });
      loadCategories();
    } catch (err) {
      alert('Error saving category: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this category?')) return;
    await categoryApi.deleteCategory(id);
    loadCategories();
  };

  const handleRestore = async (id) => {
    await categoryApi.restoreCategory(id);
    loadCategories();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📂 Category Management Hub</h2>
        <button 
          onClick={() => { setEditingCategory(null); setForm({ category_name: '', description: '', icon: '🏷️' }); setShowModal(true); }}
          style={{ padding: '10px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          + Add New Category
        </button>
      </div>

      {loading ? <p>Loading categories...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Icon</th>
              <th style={{ padding: '12px' }}>Category Name</th>
              <th style={{ padding: '12px' }}>Description</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.category_id} style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '12px', fontSize: '1.5rem' }}>{c.icon || '🏷️'}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.category_name}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>{c.description}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', background: c.is_active ? '#dcfce7' : '#fee2e2', color: c.is_active ? '#15803d' : '#b91c1c' }}>
                    {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => { setEditingCategory(c); setForm({ category_name: c.category_name, description: c.description || '', icon: c.icon || '🏷️' }); setShowModal(true); }}
                    style={{ marginRight: '8px', padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  {c.is_active ? (
                    <button onClick={() => handleDelete(c.category_id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Disable
                    </button>
                  ) : (
                    <button onClick={() => handleRestore(c.category_id)} style={{ padding: '6px 12px', background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '28px', borderRadius: '12px', width: '420px', maxWidth: '90%' }}>
            <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Icon Emoji</label>
                <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="📱, 👕, 🏠..." required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Category Name</label>
                <input value={form.category_name} onChange={e => setForm({ ...form, category_name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Electronics, Fashion..." required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px' }} placeholder="Category summary..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
