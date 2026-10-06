import React, { useState } from 'react';
import { promotionApi } from '../services/promotionApi';

export default function PromoCouponBox({ subtotal, onDiscountApplied }) {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  const handleApply = async () => {
    if (!promoCode.trim()) return;
    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      const res = await promotionApi.validatePromoCode(promoCode.trim(), subtotal);
      if (res && res.valid) {
        setMessage({ text: `🎉 Coupon "${res.code}" applied! You saved LKR ${res.discount.toLocaleString()}`, isError: false });
        if (onDiscountApplied) {
          onDiscountApplied({ code: res.code, discount: res.discount, type: res.type });
        }
      } else {
        setMessage({ text: res?.message || 'Invalid or expired promo code.', isError: true });
        if (onDiscountApplied) onDiscountApplied({ code: null, discount: 0 });
      }
    } catch (err) {
      setMessage({ text: err.message || 'Failed to validate promo code', isError: true });
      if (onDiscountApplied) onDiscountApplied({ code: null, discount: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '12px' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>🎟️ Have a Promotional Voucher?</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={promoCode} 
          onChange={e => setPromoCode(e.target.value.toUpperCase())}
          placeholder="e.g. WELCOME10, MEGA25"
          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', textTransform: 'uppercase', fontWeight: 'bold' }}
        />
        <button 
          onClick={handleApply} 
          disabled={loading || !promoCode.trim()}
          style={{ padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {loading ? 'Checking...' : 'Apply'}
        </button>
      </div>
      {message.text && (
        <p style={{ marginTop: '8px', fontSize: '0.85rem', color: message.isError ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
          {message.text}
        </p>
      )}
    </div>
  );
}
