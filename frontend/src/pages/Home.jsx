import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [activePromotions, setActivePromotions] = useState([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [subscribedMsg, setSubscribedMsg] = useState(false);

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('shopSphereUser') || 'null')
  );

  const isAdmin = Boolean(
    user &&
    (user.role === 'ADMINISTRATOR' ||
     user.role === 'ADMIN' ||
     user.role === 'STORE_MANAGER' ||
     user.role === 'MANAGER')
  );

  const loadData = async () => {
    try {
      const [cats, prods, promos] = await Promise.all([
        api.getCategories(),
        api.getProducts(false),
        api.getPromotions(),
      ]);
      setCategories(cats || []);
      const activeProds = prods || [];
      setFeaturedProducts(activeProds.slice(0, 4));
      setTotalProductsCount(activeProds.length);
      setActivePromotions((promos || []).filter((p) => p.status === 'ACTIVE'));
    } catch (err) {
      console.error('Failed to load homepage data:', err);
    }
  };

  useEffect(() => {
    loadData();

    const handleRoleUpdate = () => {
      setUser(JSON.parse(localStorage.getItem('shopSphereUser') || 'null'));
    };
    window.addEventListener('roleChanged', handleRoleUpdate);
    window.addEventListener('storage', handleRoleUpdate);
    return () => {
      window.removeEventListener('roleChanged', handleRoleUpdate);
      window.removeEventListener('storage', handleRoleUpdate);
    };
  }, []);

  const handleCopyPromo = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribedMsg(true);
      setEmailInput('');
      setTimeout(() => setSubscribedMsg(false), 5000);
    }
  };

  return (
    <div className="home-page-container">
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge-row">
              <span className="hero-pill-tag">✨ PREMIER MULTI-VENDOR SHOPPING MALL</span>
            </div>

            <h1>
              Everything You Need,<br />
              All in One Place.
            </h1>

            <p className="hero-description">
              Shop Sphere brings top global brands and certified local stores into one seamless online shopping mall. Discover electronics, fashion, home essentials, and more with guaranteed authentic quality.
            </p>

            <div className="hero-buttons">
              <Link to="/products" className="primary-button">
                Shop Catalog Now →
              </Link>
              {isAdmin ? (
                <Link to="/management" className="secondary-button">
                  🏪 Store Admin Portal
                </Link>
              ) : (
                <Link to="/products" className="secondary-button">
                  Explore Categories →
                </Link>
              )}
            </div>

            {/* Value Props */}
            <div className="hero-stats-row">
              <div className="hero-stat-item">
                <strong>100%</strong>
                <span>Authentic Brands</span>
              </div>
              <div className="hero-stat-item">
                <strong>2-3 Days</strong>
                <span>Island Delivery</span>
              </div>
              <div className="hero-stat-item">
                <strong>24/7</strong>
                <span>Customer Support</span>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <div className="hero-card-featured">
              <div className="hero-card-header">
                <span className="live-dot"></span>
                <span>Featured Mall Highlight</span>
              </div>
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
                alt="Headphones"
                className="hero-featured-img"
              />
              <div className="hero-card-body">
                <div className="hero-card-meta">
                  <span className="tag-pill">HOT DEAL</span>
                  <span className="hero-price">Rs. 12,999</span>
                </div>
                <h3>Noise-Cancelling Over-Ear Headphones</h3>
                <Link to="/products/prod-1" className="hero-buy-btn">
                  Explore Now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIAL ACTIVE PROMOTIONS / OFFERS BANNER */}
      {activePromotions.length > 0 && (
        <section className="offers-banner-section">
          <div className="offers-banner-container">
            <div className="offers-banner-head">
              <div>
                <span className="section-label">LIMITED TIME DEALS</span>
                <h2>Active Discounts & Coupons</h2>
                <p>Apply these promotional codes at checkout for instant savings:</p>
              </div>
              <Link to="/products" className="view-link">
                Shop Eligible Items →
              </Link>
            </div>

            <div className="offers-cards-carousel">
              {activePromotions.map((promo) => (
                <div key={promo.promotion_id} className="offer-pill-card">
                  <div className="offer-icon-box">🏷️</div>
                  <div className="offer-info">
                    <h4>{promo.title}</h4>
                    <p>{promo.description}</p>
                    <div className="coupon-action-row">
                      <code className="coupon-code-chip">{promo.promotion_code}</code>
                      <span style={{ fontSize: '11px', color: '#047857', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>1-Time Use</span>
                      <button
                        className="copy-coupon-btn"
                        onClick={() => handleCopyPromo(promo.promotion_code)}
                      >
                        {copiedCode === promo.promotion_code ? '✓ Copied!' : 'Copy Code'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIES SECTION */}
      <section className="section categories-section">
        <div className="section-heading">
          <div>
            <p className="section-label">DEPARTMENT DIRECTORY</p>
            <h2>Shop by Category</h2>
          </div>
          <Link to="/products" className="view-link">
            View All Categories →
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((cat) => (
            <Link
              to={`/products`}
              className="category-card"
              key={cat.category_id}
            >
              <div className="category-icon">{cat.icon || '🏷️'}</div>
              <h3>{cat.category_name}</h3>
              <p>{cat.description}</p>
              <span className="cat-explore-link">Browse Items →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS PREVIEW */}
      <section className="section featured-products-section">
        <div className="section-heading">
          <div>
            <p className="section-label">BESTSELLERS</p>
            <h2>Trending in the Mall</h2>
          </div>
          <Link to="/products" className="view-link">
            Explore Full Catalog ({totalProductsCount}) →
          </Link>
        </div>

        <div className="catalog-grid">
          {featuredProducts.map((p) => {
            const prodId = p.product_id || p.id;
            return (
              <div key={prodId} className="catalog-product-card">
                <div className="card-image-wrap">
                  <Link to={`/products/${prodId}`}>
                    <img src={p.image_url || p.image} alt={p.product_name || p.name} />
                  </Link>
                </div>
                <div className="card-body">
                  <h3 className="card-title">
                    <Link to={`/products/${prodId}`}>{p.product_name || p.name}</Link>
                  </h3>
                  <div className="card-rating-row">
                    <span className="rating-stars">{'★'.repeat(Math.round(p.rating || 5))}</span>
                    <span className="rating-num">({p.rating || 5.0})</span>
                  </div>
                  <div className="card-price-action">
                    <span className="price-tag">Rs. {Number(p.price).toLocaleString()}</span>
                    <Link to={`/products/${prodId}`} className="view-btn">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TRUST & SERVICE FEATURES */}
      <section className="section trust-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>100% Genuine Products</h3>
            <p>Direct sourcing from authorized distributors and verified brands with warranty.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>Islandwide Express Courier</h3>
            <p>Fast and tracked shipping across all districts with real-time status notifications.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>Flexible Payment Options</h3>
            <p>Cash on Delivery, Visa, Mastercard, and direct bank transfer supported securely.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Dedicated Customer Care</h3>
            <p>Attentive customer support ready to assist with your order inquiries and returns.</p>
          </div>
        </div>
      </section>

      {/* NEWSLETTER SUBSCRIBER BANNER */}
      <section className="section newsletter-section">
        <div className="newsletter-card">
          <h2>Stay Updated on New Mall Arrivals</h2>
          <p>Subscribe to receive exclusive weekly coupons, promotional flash sales, and new brand drops.</p>

          {subscribedMsg ? (
            <div className="newsletter-success">
              🎉 Thank you for subscribing! Check your inbox for your welcome discount code.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                required
                placeholder="Enter your email address..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <button type="submit" className="primary-button">
                Subscribe Now →
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;