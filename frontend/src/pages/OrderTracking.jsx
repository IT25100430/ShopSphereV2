import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Order Placed', desc: 'Received & awaiting verification', icon: '📝' },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Order & payment verified', icon: '✅' },
  { key: 'PROCESSING', label: 'Processing', desc: 'Warehouse packing items', icon: '📦' },
  { key: 'SHIPPED', label: 'Out for Delivery', desc: 'Assigned to courier', icon: '🚚' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Successfully handed to customer', icon: '🎉' },
];

function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  // Post-order reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewForms, setReviewForms] = useState({});
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [reviewToast, setReviewToast] = useState('');

  // Cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [customReason, setCustomReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Admin authorization state
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('shopSphereUser') || 'null')
  );
  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem('shopSphereLoggedIn') === 'true'
  );

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(JSON.parse(localStorage.getItem('shopSphereUser') || 'null'));
      setLoggedIn(localStorage.getItem('shopSphereLoggedIn') === 'true');
    };
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('roleChanged', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('roleChanged', handleAuthChange);
    };
  }, []);

  const isAdmin = Boolean(
    loggedIn &&
      currentUser &&
      (currentUser.role === 'ADMINISTRATOR' ||
        currentUser.role === 'ADMIN' ||
        currentUser.role === 'STORE_MANAGER' ||
        currentUser.role === 'MANAGER')
  );

  const loadOrder = async () => {
    try {
      const found = await api.getOrder(orderId);
      if (found && found.order_id) {
        setOrder(found);
        return;
      }
    } catch {
      // Fallback to localStorage if server lookup fails
    }
    const lastOrder = JSON.parse(localStorage.getItem('shopSphereLastOrder') || 'null');
    if (lastOrder && (lastOrder.order_id === orderId || lastOrder.orderNumber === orderId)) {
      setOrder(lastOrder);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await api.getReviews();
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    loadReviews();
  }, [orderId]);

  if (!order) {
    return (
      <div className="tracking-not-found">
        <h2>Order Not Found</h2>
        <p>Could not locate tracking records for order ID: {orderId}</p>
        <Link to="/products" className="primary-button">
          Continue Shopping →
        </Link>
      </div>
    );
  }

  const currentStatusIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'CANCELLED';
  const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status);

  const handleConfirmCancelOrder = async () => {
    setIsCancelling(true);
    const finalReason = cancelReason === 'Other' && customReason.trim()
      ? customReason.trim()
      : cancelReason;
    try {
      await api.cancelOrder(order.order_id, `Cancelled by customer: ${finalReason}`);
      setShowCancelModal(false);
      setReviewToast(`✓ Order #${order.order_id} has been cancelled successfully.`);
      setTimeout(() => setReviewToast(''), 6000);
      await loadOrder();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert(`Could not cancel order: ${err.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const isMyReview = (rev) => {
    const savedUser = JSON.parse(localStorage.getItem('shopSphereUser') || '{}');
    const myIds = JSON.parse(localStorage.getItem('shopSphereMyReviewIds') || '[]');
    if (myIds.includes(rev.review_id)) return true;
    if (savedUser && savedUser.user_id && rev.customer_id && rev.customer_id === savedUser.user_id) return true;
    if (savedUser && savedUser.email && rev.customer_email && rev.customer_email.toLowerCase() === savedUser.email.toLowerCase()) return true;
    const uName = (savedUser.name || `${savedUser.firstName || ''} ${savedUser.lastName || ''}`.trim() || order?.customer_name || '').toLowerCase();
    if (uName && rev.customer_name && rev.customer_name.toLowerCase() === uName) return true;
    return false;
  };

  const handleRatingChange = (prodId, rating) => {
    setReviewForms((prev) => ({
      ...prev,
      [prodId]: { ...(prev[prodId] || { comment: '' }), rating: Number(rating) },
    }));
  };

  const handleCommentChange = (prodId, comment) => {
    setReviewForms((prev) => ({
      ...prev,
      [prodId]: { ...(prev[prodId] || { rating: 5 }), comment },
    }));
  };

  const handleSubmitReview = async (prodId, prodName) => {
    const formData = reviewForms[prodId] || { rating: 5, comment: '' };
    if (!formData.comment || !formData.comment.trim()) {
      alert('Please enter your review feedback.');
      return;
    }

    const savedUser = JSON.parse(localStorage.getItem('shopSphereUser') || '{}');
    const authorName = (savedUser.firstName ? `${savedUser.firstName} ${savedUser.lastName || ''}` : savedUser.name) || order?.customer_name || 'Verified Customer';

    try {
      const created = await api.createReview({
        product_id: prodId,
        customer_name: authorName,
        customer_id: savedUser.user_id || savedUser.id || '',
        customer_email: savedUser.email || order?.customer_email || '',
        rating: formData.rating || 5,
        comment: formData.comment,
      });

      if (created && created.review_id) {
        const myIds = JSON.parse(localStorage.getItem('shopSphereMyReviewIds') || '[]');
        if (!myIds.includes(created.review_id)) {
          myIds.push(created.review_id);
          localStorage.setItem('shopSphereMyReviewIds', JSON.stringify(myIds));
        }
      }

      setReviewForms((prev) => ({ ...prev, [prodId]: { rating: 5, comment: '' } }));
      setReviewToast(`🎉 Thank you! Your review for "${prodName}" was published successfully.`);
      setTimeout(() => setReviewToast(''), 5000);
      loadReviews();
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert(`Could not submit review: ${err.message}`);
    }
  };

  const handleStartEdit = (rev) => {
    setEditingReviewId(rev.review_id);
    setEditRating(rev.rating || 5);
    setEditComment(rev.comment || '');
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment('');
  };

  const handleSaveEdit = async (reviewId) => {
    if (!editComment.trim()) {
      alert('Review comment cannot be empty.');
      return;
    }
    try {
      await api.updateReview(reviewId, {
        rating: editRating,
        comment: editComment,
      });
      setEditingReviewId(null);
      setReviewToast('✓ Your review has been updated successfully!');
      setTimeout(() => setReviewToast(''), 5000);
      loadReviews();
    } catch (err) {
      console.error('Failed to update review:', err);
      alert(`Failed to update review: ${err.message}`);
    }
  };

  const executeDeleteReview = async (reviewId) => {
    setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
    setConfirmDeleteId(null);
    try {
      await api.deleteReview(reviewId);
      const myIds = JSON.parse(localStorage.getItem('shopSphereMyReviewIds') || '[]');
      const updated = myIds.filter((id) => id !== reviewId);
      localStorage.setItem('shopSphereMyReviewIds', JSON.stringify(updated));
      setReviewToast('✓ Your review has been deleted.');
      setTimeout(() => setReviewToast(''), 4000);
      loadReviews();
    } catch (err) {
      console.warn('Delete review warning:', err);
    }
  };

  const handleSimulateNextStatus = async () => {
    const nextStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const idx = nextStatuses.indexOf(order.status);
    if (idx < nextStatuses.length - 1) {
      const nextStatus = nextStatuses[idx + 1];
      try {
        await api.updateOrderStatus(order.order_id, nextStatus, 'Sunil Rathnayake');
      } catch (err) {
        console.error('Failed to update status:', err);
      }
      loadOrder();
    }
  };

  return (
    <div className="order-tracking-page">
      <div className="tracking-container">
        {/* Header */}
        <div className="tracking-header">
          <div className="tracking-header-left">
            <span className="order-badge">Live Order Tracker</span>
            <h1>Order #{order.order_id || order.orderNumber}</h1>
            <p className="order-date-text">
              Placed on {new Date(order.order_date || order.orderDate).toLocaleString()}
            </p>
          </div>
          <div className="tracking-header-right">
            {canCancel && (
              <button
                className="cancel-order-header-btn"
                onClick={() => setShowCancelModal(true)}
              >
                🚫 Cancel Order
              </button>
            )}
            <button className="print-invoice-btn" onClick={() => window.print()}>
              🖨️ Print Invoice
            </button>
            <Link to="/products" className="continue-link">
              Continue Shopping →
            </Link>
          </div>
        </div>

        {/* Status Notification Banner */}
        {reviewToast && (
          <div
            style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '14px 20px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
            }}
          >
            <span>{reviewToast}</span>
          </div>
        )}

        {isCancelled ? (
          <div className="alert-cancelled">
            <span style={{ fontSize: '24px' }}>❌</span>
            <div>
              <strong style={{ fontSize: '16px', display: 'block', marginBottom: '2px' }}>Order Cancelled</strong>
              <span style={{ fontSize: '13px', color: '#7f1d1d' }}>
                {order.staff_name || 'This order has been cancelled.'}
              </span>
            </div>
          </div>
        ) : (
          <div className="timeline-card">
            <h3>Fulfillment & Delivery Progress</h3>
            <div className="timeline-stepper">
              {ORDER_STEPS.map((step, index) => {
                const isPassed = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                return (
                  <div key={step.key} className={`step-item ${isPassed ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}>
                    <div className="step-circle">
                      {isPassed ? '✓' : index + 1}
                    </div>
                    <div className="step-content">
                      <span className="step-icon">{step.icon}</span>
                      <strong className="step-title">{step.label}</strong>
                      <p className="step-desc">{step.desc}</p>
                    </div>
                    {index < ORDER_STEPS.length - 1 && <div className={`step-line ${index < currentStatusIndex ? 'filled' : ''}`}></div>}
                  </div>
                );
              })}
            </div>

            {/* Customer cancellation shortcut */}
            {canCancel && (
              <div className="customer-cancel-strip">
                <div>
                  <strong>Need to make changes or cancel?</strong>
                  <p>You can cancel this order anytime before warehouse dispatch without penalty.</p>
                </div>
                <button
                  className="cancel-order-pill-btn"
                  onClick={() => setShowCancelModal(true)}
                >
                  🚫 Cancel Order
                </button>
              </div>
            )}

            {/* Order Status Controller - Only visible for Administrator login */}
            {isAdmin && (
              <div className="timeline-simulator-bar">
                <span>⚡ Admin Status Action:</span>
                <button
                  className="simulate-btn"
                  onClick={handleSimulateNextStatus}
                  disabled={order.status === 'DELIVERED'}
                >
                  Progress to Next Stage ⏩
                </button>
                <Link to="/management?tab=ORDERS" className="ops-mgr-link">
                  Open Orders Management Console →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 2 Column Details */}
        <div className="order-details-grid">
          {/* Items Section */}
          <div className="tracking-card">
            <h3>Ordered Products ({order.order_items?.length || order.items?.length || 0})</h3>
            <div className="tracking-items-list">
              {(order.order_items || order.items || []).map((item, idx) => (
                <div key={idx} className="tracking-item-row">
                  <img src={item.image_url || item.image} alt={item.product_name || item.name} />
                  <div className="tracking-item-meta">
                    <h4>{item.product_name || item.name}</h4>
                    <span className="tracking-qty">Quantity: {item.quantity}</span>
                  </div>
                  <div className="tracking-item-price">
                    Rs. {(Number(item.price) * Number(item.quantity)).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="tracking-financials">
              <div className="fin-row">
                <span>Subtotal:</span>
                <span>Rs. {Number(order.subtotal).toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="fin-row discount-row">
                  <span>Promo Discount ({order.promo_code}):</span>
                  <span>− Rs. {Number(order.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="fin-row">
                <span>Standard Delivery:</span>
                <span>Rs. {Number(order.delivery_fee || order.delivery || 350).toLocaleString()}</span>
              </div>
              <div className="fin-row total-row">
                <strong>Grand Total:</strong>
                <strong>Rs. {Number(order.total_amount || order.total).toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Information */}
          <div className="tracking-card">
            <h3>Shipping & Courier Details</h3>
            <div className="info-block">
              <span className="info-label">Customer Name</span>
              <strong>
                {order.customer_name ||
                  `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim()}
              </strong>
            </div>

            <div className="info-block">
              <span className="info-label">Delivery Address</span>
              <p>
                {order.shipping_address || order.customer?.address}
                <br />
                {order.city || order.customer?.city},{' '}
                {order.postal_code || order.customer?.postalCode}
              </p>
            </div>

            <div className="info-block">
              <span className="info-label">Assigned Delivery Courier</span>
              <div className="courier-badge">
                <span>🚚</span>
                <div>
                  <strong>{order.staff_name || 'Sunil Rathnayake (ShopSphere Express)'}</strong>
                  <p>Vehicle: {order.vehicle_no || 'WP-CA-8842'} • Available</p>
                </div>
              </div>
            </div>

            <hr />

            <h3>Payment Information</h3>
            <div className="info-block">
              <span className="info-label">Payment Method</span>
              <strong>{order.payment_method || 'Cash on Delivery'}</strong>
            </div>
            <div className="info-block">
              <span className="info-label">Payment Status</span>
              <span className={`status-pill ${order.payment_status === 'COMPLETED' ? 'success' : 'warning'}`}>
                {order.payment_status || 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        {/* Post-Order Reviews Section */}
        <div className="order-reviews-section" style={{ marginTop: '2.5rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#fff',
              borderRadius: '16px 16px 0 0',
              padding: '1.5rem 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                ⭐ Verified Purchase Feedback
              </span>
              <h2 style={{ margin: '8px 0 4px', fontSize: '1.5rem', fontWeight: 700 }}>
                Rate & Review Your Ordered Items
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                Your order is confirmed! Share your authentic feedback, edit, or manage reviews for the items in this order.
              </p>
            </div>
            <span style={{ fontSize: '2.5rem' }}>📝</span>
          </div>

          {reviewToast && (
            <div
              style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '12px 18px',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{reviewToast}</span>
            </div>
          )}

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderTop: 'none',
              borderRadius: '0 0 16px 16px',
              padding: '1.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
          >
            {(order.order_items || order.items || []).map((item, idx) => {
              const prodId = item.product_id || item.id || `item-${idx}`;
              const prodName = item.product_name || item.name || 'Product';
              const prodImage = item.image_url || item.image || '';

              // Find any existing review written by this customer for this product
              const myItemReview = reviews.find(
                (r) =>
                  (r.product_id === prodId ||
                    (r.product && (r.product.product_id === prodId || r.product.id === prodId))) &&
                  isMyReview(r)
              );

              const isEditing = myItemReview && editingReviewId === myItemReview.review_id;
              const currentForm = reviewForms[prodId] || { rating: 5, comment: '' };

              return (
                <div
                  key={prodId || idx}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    background: '#f8fafc',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1.2rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #e2e8f0',
                    }}
                  >
                    {prodImage && (
                      <img
                        src={prodImage}
                        alt={prodName}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        Item from this order
                      </span>
                      <h4 style={{ margin: '2px 0 0', fontSize: '1.1rem', color: '#1e293b' }}>
                        {prodName}
                      </h4>
                      <Link
                        to={`/products/${prodId}`}
                        style={{
                          fontSize: '13px',
                          color: '#6366f1',
                          textDecoration: 'none',
                          fontWeight: 500,
                          display: 'inline-block',
                          marginTop: '4px',
                        }}
                      >
                        View Public Product Page →
                      </Link>
                    </div>
                  </div>

                  {/* If user already reviewed this item */}
                  {myItemReview ? (
                    isEditing ? (
                      /* Inline Edit Form */
                      <div
                        style={{
                          background: '#ffffff',
                          border: '2px solid #6366f1',
                          borderRadius: '10px',
                          padding: '1.2rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px',
                          }}
                        >
                          <strong style={{ color: '#4338ca', fontSize: '15px' }}>
                            ✏️ Edit Your Review
                          </strong>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Originally posted {new Date(myItemReview.review_date).toLocaleDateString()}
                          </span>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#334155',
                              marginBottom: '4px',
                            }}
                          >
                            Your Rating:
                          </label>
                          <select
                            value={editRating}
                            onChange={(e) => setEditRating(Number(e.target.value))}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontWeight: 600,
                              fontSize: '14px',
                              background: '#fff',
                            }}
                          >
                            <option value={5}>⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                            <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                            <option value={3}>⭐⭐⭐ (3 - Average)</option>
                            <option value={2}>⭐⭐ (2 - Below Expectation)</option>
                            <option value={1}>⭐ (1 - Disappointed)</option>
                          </select>
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#334155',
                              marginBottom: '4px',
                            }}
                          >
                            Your Review:
                          </label>
                          <textarea
                            rows={3}
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '14px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(myItemReview.review_id)}
                            style={{
                              padding: '8px 18px',
                              background: '#16a34a',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            💾 Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            style={{
                              padding: '8px 14px',
                              background: '#94a3b8',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display My Review */
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #bbf7d0',
                          borderRadius: '10px',
                          padding: '1.2rem',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                background: '#dcfce7',
                                color: '#166534',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}
                            >
                              ✓ Your Published Review
                            </span>
                            <span style={{ color: '#eab308', fontSize: '15px' }}>
                              {'★'.repeat(myItemReview.rating || 5)}
                              {'☆'.repeat(5 - (myItemReview.rating || 5))}
                            </span>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#1e293b',
                              }}
                            >
                              ({myItemReview.rating}/5)
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {new Date(myItemReview.review_date).toLocaleDateString()}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: '8px 0 14px',
                            color: '#334155',
                            fontStyle: 'italic',
                            lineHeight: 1.5,
                            fontSize: '14px',
                          }}
                        >
                          "{myItemReview.comment}"
                        </p>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(myItemReview)}
                            style={{
                              padding: '6px 14px',
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '13px',
                            }}
                          >
                            ✏️ Edit Review
                          </button>

                          {confirmDeleteId === myItemReview.review_id ? (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#fef2f2',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #fca5a5',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: '#b91c1c',
                                  fontWeight: 600,
                                }}
                              >
                                Delete?
                              </span>
                              <button
                                type="button"
                                onClick={() => executeDeleteReview(myItemReview.review_id)}
                                style={{
                                  padding: '3px 10px',
                                  background: '#dc2626',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                }}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                style={{
                                  padding: '3px 8px',
                                  background: '#94a3b8',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                }}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(myItemReview.review_id)}
                              style={{
                                padding: '6px 14px',
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '13px',
                              }}
                            >
                              🗑️ Delete Review
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  ) : (
                    /* Write New Review for this Order Item */
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '1.2rem',
                      }}
                    >
                      <h5
                        style={{
                          margin: '0 0 8px',
                          fontSize: '14px',
                          color: '#1e293b',
                          fontWeight: 600,
                        }}
                      >
                        Rate & Review this product:
                      </h5>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '12px',
                          marginBottom: '12px',
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#475569',
                              marginBottom: '4px',
                            }}
                          >
                            Rating:
                          </label>
                          <select
                            value={currentForm.rating || 5}
                            onChange={(e) => handleRatingChange(prodId, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px',
                              background: '#fff',
                            }}
                          >
                            <option value={5}>⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                            <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                            <option value={3}>⭐⭐⭐ (3 - Average)</option>
                            <option value={2}>⭐⭐ (2 - Below Expectation)</option>
                            <option value={1}>⭐ (1 - Poor)</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#475569',
                            marginBottom: '4px',
                          }}
                        >
                          Your Feedback:
                        </label>
                        <textarea
                          rows={2}
                          placeholder={`How was the ${prodName}? Share quality, performance, delivery experience...`}
                          value={currentForm.comment || ''}
                          onChange={(e) => handleCommentChange(prodId, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSubmitReview(prodId, prodName)}
                        style={{
                          padding: '8px 20px',
                          background: '#6366f1',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        Submit Review →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CANCEL ORDER MODAL */}
        {showCancelModal && (
          <div className="hub-modal-overlay" onClick={() => !isCancelling && setShowCancelModal(false)}>
            <div className="hub-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>🚫 Cancel Order #{order.order_id || order.orderNumber}</h3>
                <button className="close-btn" disabled={isCancelling} onClick={() => setShowCancelModal(false)}>✕</button>
              </div>
              <div style={{ padding: '24px' }}>
                <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5', margin: '0 0 16px' }}>
                  Are you sure you want to cancel this order? Any reserved inventory will be returned to store stock, and this action cannot be undone.
                </p>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: '6px' }}>
                    Please select a reason for cancellation:
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                  >
                    <option value="Changed my mind">Changed my mind</option>
                    <option value="Ordered by mistake">Ordered by mistake</option>
                    <option value="Found a better price or alternative">Found a better price or alternative</option>
                    <option value="Delivery time is too long">Delivery time is too long</option>
                    <option value="Need to change shipping address or items">Need to change shipping address or items</option>
                    <option value="Other">Other reason</option>
                  </select>
                </div>

                {cancelReason === 'Other' && (
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: '6px' }}>
                      Describe your reason:
                    </label>
                    <textarea
                      rows={2}
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Enter reason for cancellation..."
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="cancel-btn"
                    disabled={isCancelling}
                    onClick={() => setShowCancelModal(false)}
                  >
                    Keep Order
                  </button>
                  <button
                    type="button"
                    style={{
                      background: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: isCancelling ? 'not-allowed' : 'pointer',
                      opacity: isCancelling ? 0.7 : 1
                    }}
                    disabled={isCancelling}
                    onClick={handleConfirmCancelOrder}
                  >
                    {isCancelling ? 'Cancelling...' : 'Confirm Order Cancellation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderTracking;
