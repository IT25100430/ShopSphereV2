import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmittedMsg, setReviewSubmittedMsg] = useState('');

  // Editing state for customers to edit their reviews
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [userOrders, setUserOrders] = useState([]);

  const loadProductData = async () => {
    try {
      const [prod, cats, brds, revs, ords] = await Promise.all([
        api.getProduct(id),
        api.getCategories(),
        api.getBrands(),
        api.getReviews(id),
        api.getOrders().catch(() => []),
      ]);
      setProduct(prod);
      setCategories(cats || []);
      setBrands(brds || []);
      setReviews(revs || []);
      setUserOrders(ords || []);
    } catch (err) {
      console.error('Failed to load product details:', err);
    }
  };

  useEffect(() => {
    loadProductData();

    // Prefill user name if logged in
    const savedUser = JSON.parse(localStorage.getItem('shopSphereUser') || '{}');
    const uName = (savedUser.firstName ? `${savedUser.firstName} ${savedUser.lastName || ''}` : savedUser.name) || '';
    if (uName) {
      setReviewName(uName.trim());
    }
  }, [id]);

  const isMyReview = (rev) => {
    const savedUser = JSON.parse(localStorage.getItem('shopSphereUser') || '{}');
    const myIds = JSON.parse(localStorage.getItem('shopSphereMyReviewIds') || '[]');
    if (myIds.includes(rev.review_id)) return true;

    if (savedUser && savedUser.user_id && rev.customer_id && rev.customer_id === savedUser.user_id) return true;
    if (savedUser && savedUser.email && rev.customer_email && rev.customer_email.toLowerCase() === savedUser.email.toLowerCase()) return true;

    const uName = (savedUser.name || `${savedUser.firstName || ''} ${savedUser.lastName || ''}`).trim().toLowerCase();
    if (uName && rev.customer_name && rev.customer_name.toLowerCase() === uName) return true;

    // Admin can also manage reviews
    if (savedUser && (savedUser.role === 'ADMINISTRATOR' || savedUser.role === 'ADMIN')) return true;

    return false;
  };

  const hasOrderedProduct = () => {
    const prodId = product?.product_id || product?.id;
    if (!prodId) return false;

    // 1. If user already wrote a review, they clearly have access
    if (reviews.some((r) => isMyReview(r))) return true;

    // 2. Check locally saved ordered products
    const orderedIds = JSON.parse(localStorage.getItem('shopSphereOrderedProductIds') || '[]');
    if (orderedIds.includes(prodId)) return true;

    // 3. Check last placed order in session
    const lastOrder = JSON.parse(localStorage.getItem('shopSphereLastOrder') || 'null');
    if (lastOrder && (lastOrder.order_items || lastOrder.items)) {
      const items = lastOrder.order_items || lastOrder.items;
      if (items.some((it) => (it.product_id || it.id) === prodId)) return true;
    }

    // 4. Check customer orders from database
    const savedUser = JSON.parse(localStorage.getItem('shopSphereUser') || '{}');
    if (userOrders && userOrders.length > 0) {
      for (const ord of userOrders) {
        const isUserOrder = (savedUser.user_id && ord.customer_id === savedUser.user_id) ||
                            (savedUser.email && ord.customer_email && ord.customer_email.toLowerCase() === savedUser.email.toLowerCase()) ||
                            (savedUser.name && ord.customer_name && ord.customer_name.toLowerCase() === savedUser.name.toLowerCase());
        if (isUserOrder || (!savedUser.user_id && !savedUser.email)) {
          const items = ord.order_items || ord.items || [];
          if (items.some((it) => (it.product_id || it.id) === prodId)) return true;
        }
      }
    }

    // 5. Administrators have full access
    if (savedUser && (savedUser.role === 'ADMINISTRATOR' || savedUser.role === 'ADMIN')) return true;

    return false;
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
      setReviewSubmittedMsg('✓ Your review has been updated successfully!');
      setTimeout(() => setReviewSubmittedMsg(''), 5000);
      loadProductData();
    } catch (err) {
      console.error('Failed to update review:', err);
      alert(`Failed to update review: ${err.message}`);
    }
  };

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const executeDeleteReview = async (reviewId) => {
    // Optimistic UI update: immediately remove review from UI
    setReviews((prev) => prev.filter((r) => r.review_id !== reviewId && r.id !== reviewId));
    setConfirmDeleteId(null);

    try {
      await api.deleteReview(reviewId);
    } catch (err) {
      console.warn('API deleteReview error (may be local or already removed):', err);
    }

    // Clean up local stored IDs
    try {
      const myIds = JSON.parse(localStorage.getItem('shopSphereMyReviewIds') || '[]');
      const updated = myIds.filter((id) => id !== reviewId);
      localStorage.setItem('shopSphereMyReviewIds', JSON.stringify(updated));
    } catch (e) {}

    setReviewSubmittedMsg('✓ Your review has been deleted.');
    setTimeout(() => setReviewSubmittedMsg(''), 4000);
    loadProductData();
  };

  if (!product) {
    return (
      <div className="detail-not-found">
        <h2>Product Not Found</h2>
        <p>We couldn't locate the requested product in the Shop Sphere catalog.</p>
        <Link to="/products" className="primary-button">
          Browse Catalog →
        </Link>
      </div>
    );
  }

  const categoryObj = categories.find((c) => c.category_id === product.category_id);
  const brandObj = brands.find((b) => b.brand_id === product.brand_id);

  const categoryName = categoryObj ? categoryObj.category_name : product.category || 'General';
  const brandName = brandObj ? brandObj.brand_name : 'ShopSphere Certified';

  const isOutOfStock = (product.stock_qty || 0) <= 0;
  const isLowStock = !isOutOfStock && product.stock_qty <= (product.low_stock_threshold || 5);

  const handleAddToCart = async () => {
    if (isOutOfStock) return;

    const existingCart = JSON.parse(localStorage.getItem('shopSphereCart')) || [];
    const prodKey = product.product_id || product.id;
    const existingIndex = existingCart.findIndex((item) => (item.product_id || item.id) === prodKey);

    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = [...existingCart];
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart = [
        ...existingCart,
        {
          id: prodKey,
          product_id: prodKey,
          name: product.product_name || product.name,
          category: categoryName,
          price: product.price,
          image: product.image_url || product.image,
          quantity: quantity,
        },
      ];
    }

    localStorage.setItem('shopSphereCart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));

    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 3000);

    // Persist to MySQL database carts and cart_items tables
    try {
      const serverCart = await api.addToCart(prodKey, quantity);
      if (serverCart && serverCart.cart_items) {
        const synced = serverCart.cart_items.map((ci) => {
          const p = ci.product || product;
          const catObj = categories.find((c) => c.category_id === p.category_id);
          return {
            item_id: ci.item_id,
            id: ci.product_id,
            product_id: ci.product_id,
            name: p.product_name || p.name || product.product_name,
            category: catObj ? catObj.category_name : categoryName,
            price: Number(p.price || product.price),
            image: p.image_url || p.image || product.image_url,
            quantity: ci.quantity,
          };
        });
        localStorage.setItem('shopSphereCart', JSON.stringify(synced));
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (err) {
      console.warn('Backend cart sync note:', err);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    const savedUser = JSON.parse(localStorage.getItem('shopSphereUser') || '{}');
    const uName = (savedUser.firstName ? `${savedUser.firstName} ${savedUser.lastName || ''}` : savedUser.name) || '';

    try {
      const created = await api.createReview({
        product_id: product.product_id || product.id,
        customer_name: reviewName || uName || 'Verified Customer',
        customer_id: savedUser.user_id || savedUser.id || '',
        customer_email: savedUser.email || '',
        rating: reviewRating,
        comment: reviewComment,
      });

      if (created && created.review_id) {
        const myIds = JSON.parse(localStorage.getItem('shopSphereMyReviewIds') || '[]');
        if (!myIds.includes(created.review_id)) {
          myIds.push(created.review_id);
          localStorage.setItem('shopSphereMyReviewIds', JSON.stringify(myIds));
        }
      }

      setReviewComment('');
      setReviewSubmittedMsg(
        '🎉 Thank you! Your review has been published successfully.'
      );
      setTimeout(() => setReviewSubmittedMsg(''), 5000);
      loadProductData();
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert(`Could not submit review: ${err.message}`);
    }
  };

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* Breadcrumb */}
        <div className="breadcrumb-nav">
          <Link to="/">Home</Link> / <Link to="/products">Products</Link> /{' '}
          <span className="current">{product.product_name || product.name}</span>
        </div>

        {/* Top Product Section */}
        <div className="product-detail-grid">
          {/* Product Image */}
          <div className="detail-image-card">
            <img src={product.image_url || product.image} alt={product.product_name || product.name} />
            {isOutOfStock && <span className="stock-pill out">Out of Stock</span>}
            {isLowStock && <span className="stock-pill low">Low Stock: Only {product.stock_qty} left!</span>}
          </div>

          {/* Product Info */}
          <div className="detail-info-card">
            <div className="detail-badges">
              <span className="badge category-badge">{categoryName}</span>
              <span className="badge brand-badge">{brandName}</span>
            </div>

            <h1 className="detail-title">{product.product_name || product.name}</h1>

            <div className="detail-rating-row">
              <span className="stars">{'★'.repeat(Math.round(product.rating || 5))}</span>
              <span className="rating-score">({product.rating || 5.0})</span>
              <span className="review-count">• {reviews.length} Verified Review(s)</span>
            </div>

            <div className="detail-price-box">
              <span className="price-currency">Rs.</span>
              <span className="price-value">{Number(product.price).toLocaleString()}</span>
              <span className="vat-tag">Inclusive of all taxes</span>
            </div>

            <p className="detail-description">
              {product.description ||
                'Experience unparalleled performance and supreme quality with this genuine product, backed by official warranty and customer protection on ShopSphere.'}
            </p>

            <div className="stock-status-box">
              <strong>Availability: </strong>
              {isOutOfStock ? (
                <span className="text-danger">Out of Stock (Replenishing soon)</span>
              ) : (
                <span className="text-success">
                  In Stock ({product.stock_qty} available in central warehouse)
                </span>
              )}
            </div>

            {/* Quantity and Actions */}
            {!isOutOfStock && (
              <div className="purchase-action-group">
                <div className="qty-selector">
                  <label>Quantity:</label>
                  <div className="qty-buttons">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock_qty || 99, quantity + 1))}>+</button>
                  </div>
                </div>

                <div className="action-buttons-row">
                  <button className="add-to-cart-big-btn" onClick={handleAddToCart}>
                    🛒 Add {quantity} to Cart
                  </button>
                  <button
                    className="buy-now-btn"
                    onClick={() => {
                      handleAddToCart();
                      navigate('/checkout');
                    }}
                  >
                    ⚡ Buy Now
                  </button>
                </div>
              </div>
            )}

            {addedMessage && (
              <div className="toast-success">
                ✓ Added to cart! <Link to="/cart">View Cart & Checkout →</Link>
              </div>
            )}

            {/* Shopping perks */}
            <div className="perks-grid">
              <div className="perk-item">
                <span>🚚</span>
                <div>
                  <strong>Island-Wide Fast Delivery</strong>
                  <p>Reliable courier dispatch in 2-3 business days</p>
                </div>
              </div>
              <div className="perk-item">
                <span>🛡️</span>
                <div>
                  <strong>100% Genuine Guaranteed</strong>
                  <p>Verified brand product with direct warranty</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews & Feedback Section */}
        <section className="product-reviews-section">
          <div className="reviews-header">
            <div>
              <p className="section-label">CUSTOMER FEEDBACK</p>
              <h2>Ratings & Verified Reviews</h2>
              <p className="reviews-sub">
                Real customer feedback and ratings submitted for this product.
              </p>
            </div>
          </div>

          {/* Review section: available after order is placed */}
          {(() => {
            const hasOrdered = hasOrderedProduct();
            const myExistingReview = reviews.find((r) => isMyReview(r));

            if (!hasOrdered) {
              return (
                <div
                  className="submit-review-card"
                  style={{
                    textAlign: 'center',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '2rem 1.5rem',
                    margin: '1.5rem 0 2rem'
                  }}
                >
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🛍️</span>
                  <h3 style={{ margin: '0 0 6px', color: '#1e293b' }}>Review Available After Order</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '520px', margin: '0 auto 1.2rem', lineHeight: 1.6 }}>
                    To ensure all ratings and feedback are authentic, the review section is placed <strong>after an order is placed</strong> for this product. Place an order to share your review!
                  </p>
                  {!isOutOfStock && (
                    <button
                      type="button"
                      className="submit-review-btn"
                      style={{ display: 'inline-block', width: 'auto', padding: '10px 24px', cursor: 'pointer' }}
                      onClick={() => {
                        handleAddToCart();
                        navigate('/checkout');
                      }}
                    >
                      🛒 Order This Product to Review →
                    </button>
                  )}
                </div>
              );
            }

            if (myExistingReview) {
              return (
                <div
                  className="submit-review-card"
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '1.2rem 1.5rem',
                    margin: '1.5rem 0 2rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#166534', fontSize: '15px' }}>✓ Verified Buyer: You have reviewed this product</h4>
                      <p style={{ margin: '4px 0 0', color: '#15803d', fontSize: '13px' }}>
                        Thank you for your feedback! You can edit or delete your review below anytime.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(myExistingReview)}
                      style={{ padding: '6px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                    >
                      ✏️ Edit Your Review
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="submit-review-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                    ✓ Verified Buyer
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Order placed for this item</span>
                </div>
                <h3>Write a Customer Review</h3>
                <p>Share your honest feedback about this product with our shopping mall community!</p>

                {reviewSubmittedMsg && <div className="toast-moderation-msg">{reviewSubmittedMsg}</div>}

                <form onSubmit={handleReviewSubmit} className="review-form">
                  <div className="review-form-row">
                    <div className="form-group">
                      <label>Your Name:</label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Rating:</label>
                      <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                        <option value="5">⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                        <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                        <option value="3">⭐⭐⭐ (3 - Average)</option>
                        <option value="2">⭐⭐ (2 - Below Expectation)</option>
                        <option value="1">⭐ (1 - Poor)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Review & Feedback:</label>
                    <textarea
                      rows="3"
                      placeholder="Share details of your experience with sound quality, comfort, durability, or delivery..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="submit-review-btn">
                    Submit Review →
                  </button>
                </form>
              </div>
            );
          })()}

          {/* Customer Reviews List */}
          <div className="reviews-list">
            <h3>Customer Reviews ({reviews.length})</h3>

            {reviews.length === 0 ? (
              <div className="no-reviews-box">
                <p>No published reviews for this product yet.</p>
                <span>Be the first to submit a review using the form above!</span>
              </div>
            ) : (
              <div className="reviews-grid">
                {reviews.map((rev) => {
                  const isAuthor = isMyReview(rev);
                  const isEditing = editingReviewId === rev.review_id;

                  if (isEditing) {
                    return (
                      <div
                        key={rev.review_id}
                        className="review-item-card editing"
                        style={{ border: '2px solid #8b5cf6', background: '#faf5ff', borderRadius: '10px', padding: '1.2rem' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <strong style={{ color: '#6b21a8' }}>✏️ Edit Your Review</strong>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            Originally posted {new Date(rev.review_date).toLocaleDateString()}
                          </span>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ fontWeight: 600, display: 'block', fontSize: '13px', marginBottom: '4px' }}>
                            Rating:
                          </label>
                          <select
                            value={editRating}
                            onChange={(e) => setEditRating(Number(e.target.value))}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600, background: '#fff' }}
                          >
                            <option value={5}>⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                            <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                            <option value={3}>⭐⭐⭐ (3 - Average)</option>
                            <option value={2}>⭐⭐ (2 - Below Average)</option>
                            <option value={1}>⭐ (1 - Disappointed)</option>
                          </select>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ fontWeight: 600, display: 'block', fontSize: '13px', marginBottom: '4px' }}>
                            Your Feedback:
                          </label>
                          <textarea
                            rows="3"
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit', resize: 'vertical' }}
                            required
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(rev.review_id)}
                            style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#8b5cf6', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}
                          >
                            💾 Save Changes
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={rev.review_id} className="review-item-card">
                      <div className="review-card-top">
                        <div>
                          <strong>{rev.customer_name}</strong>
                          <span className="verified-buyer-tag">✓ Verified Buyer</span>
                          {isAuthor && (
                            <span style={{ marginLeft: '8px', background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              Your Review
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="review-stars">{'★'.repeat(rev.rating || 5)}</span>
                          {isAuthor && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(rev)}
                                title="Edit your review"
                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#334155' }}
                              >
                                ✏️ Edit
                              </button>
                              {confirmDeleteId === rev.review_id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '2px 6px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#b91c1c' }}>Delete?</span>
                                  <button
                                    type="button"
                                    onClick={() => executeDeleteReview(rev.review_id)}
                                    style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer', color: '#475569' }}
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(rev.review_id)}
                                  title="Delete your review"
                                  style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#dc2626' }}
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="review-comment">"{rev.comment}"</p>
                      <span className="review-date">
                        Posted on {new Date(rev.review_date).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProductDetail;
