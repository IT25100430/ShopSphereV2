import React, { useState, useEffect } from 'react';
import { reviewApi } from '../services/reviewApi';

export default function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [author, setAuthor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await reviewApi.getReviews(productId);
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await reviewApi.createReview({
        product_id: productId,
        customer_name: author.trim() || 'Verified Buyer',
        rating,
        comment: comment.trim(),
      });
      setComment('');
      setAuthor('');
      setRating(5);
      loadReviews();
    } catch (err) {
      alert('Error submitting review: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1) : '5.0';

  return (
    <div style={{ marginTop: '32px', background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>⭐ Customer Reviews & Feedback</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Average Rating: <strong>{avgRating} / 5.0</strong> ({reviews.length} reviews)</p>
        </div>
      </div>

      {/* Write a review form */}
      <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '12px' }}>Leave a Customer Review</h4>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Rating Score</label>
            <select value={rating} onChange={e => setRating(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="5">⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
              <option value="4">⭐⭐⭐⭐☆ (4/5 Very Good)</option>
              <option value="3">⭐⭐⭐☆☆ (3/5 Average)</option>
              <option value="2">⭐⭐☆☆☆ (2/5 Poor)</option>
              <option value="1">⭐☆☆☆☆ (1/5 Terrible)</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Your Name (Optional)</label>
            <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. Kasun P." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Detailed Feedback</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience with this product..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px' }} required />
        </div>
        <button type="submit" disabled={submitting} style={{ marginTop: '10px', padding: '8px 20px', background: '#eab308', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {submitting ? 'Submitting...' : 'Post Verified Review'}
        </button>
      </form>

      {/* Reviews list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {reviews.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map(r => (
            <div key={r.review_id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{r.customer_name || 'Verified Buyer'}</span>
                <span style={{ color: '#eab308', letterSpacing: '2px' }}>{r.rating_stars || '★★★★★'}</span>
              </div>
              <p style={{ margin: '6px 0', color: '#475569' }}>{r.comment}</p>
              <small style={{ color: '#94a3b8' }}>{r.review_date || 'Recently'}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
