import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [brand, setBrand] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [cartToast, setCartToast] = useState('');

  const loadData = async () => {
    try {
      const [prods, cats, brds] = await Promise.all([
        api.getProducts(false),
        api.getCategories(),
        api.getBrands(),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
      setBrands(brds || []);
    } catch (err) {
      console.error('Failed to load catalog data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addToCart = async (product) => {
    if (product.stock_qty <= 0) return;

    const existingCart = JSON.parse(localStorage.getItem('shopSphereCart')) || [];
    const prodKey = product.product_id || product.id;
    const existing = existingCart.find((item) => (item.product_id || item.id) === prodKey);

    let updatedCart;
    if (existing) {
      updatedCart = existingCart.map((item) =>
        (item.product_id || item.id) === prodKey
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      const catObj = categories.find((c) => c.category_id === product.category_id);
      updatedCart = [
        ...existingCart,
        {
          id: prodKey,
          product_id: prodKey,
          name: product.product_name || product.name,
          category: catObj ? catObj.category_name : product.category || 'General',
          price: product.price,
          image: product.image_url || product.image,
          quantity: 1,
        },
      ];
    }

    localStorage.setItem('shopSphereCart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));

    setCartToast(`✓ Added "${product.product_name || product.name}" to cart!`);
    setTimeout(() => setCartToast(''), 3000);

    // Persist to MySQL database carts and cart_items tables
    try {
      const serverCart = await api.addToCart(prodKey, 1);
      if (serverCart && serverCart.cart_items) {
        const synced = serverCart.cart_items.map((ci) => {
          const p = ci.product || product;
          const catObj = categories.find((c) => c.category_id === p.category_id);
          return {
            item_id: ci.item_id,
            id: ci.product_id,
            product_id: ci.product_id,
            name: p.product_name || p.name || product.product_name,
            category: catObj ? catObj.category_name : p.category || 'General',
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

  // Filter and Sort logic
  let filtered = products.filter((product) => {
    const prodName = (product.product_name || product.name || '').toLowerCase();
    const prodDesc = (product.description || '').toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = prodName.includes(q) || prodDesc.includes(q);

    const matchesCategory =
      category === 'ALL' ||
      product.category_id === category ||
      product.category === category;

    const matchesBrand =
      brand === 'ALL' ||
      product.brand_id === brand;

    return matchesSearch && matchesCategory && matchesBrand;
  });

  if (sortBy === 'PRICE_LOW') {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortBy === 'PRICE_HIGH') {
    filtered.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sortBy === 'RATING') {
    filtered.sort((a, b) => Number(b.rating || 5) - Number(a.rating || 5));
  }

  return (
    <div className="products-catalog-page">
      {cartToast && <div className="cart-toast-banner">{cartToast}</div>}

      {/* Hero Header */}
      <section className="catalog-header-section">
        <p className="section-label">SHOPSPHERE COLLECTION</p>
        <h1>Explore Mall Products</h1>
        <p className="catalog-subtext">
          Browse verified products from top brands and certified vendors across Sri Lanka.
        </p>
      </section>

      {/* Filter and Search Bar */}
      <section className="catalog-controls-container">
        <div className="search-filter-grid">
          {/* Keyword Search */}
          <div className="control-box flex-2">
            <input
              type="text"
              placeholder="Search by product name, features, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="catalog-search-input"
            />
          </div>

          {/* Category Filter */}
          <div className="control-box">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="catalog-select"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.icon} {c.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter (PBI-17-20) */}
          <div className="control-box">
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="catalog-select"
            >
              <option value="ALL">All Brands</option>
              {brands.map((b) => (
                <option key={b.brand_id} value={b.brand_id}>
                  {b.brand_name} ({b.origin || 'Intl'})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="control-box">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="catalog-select"
            >
              <option value="DEFAULT">Sort By: Featured</option>
              <option value="PRICE_LOW">Price: Low to High</option>
              <option value="PRICE_HIGH">Price: High to Low</option>
              <option value="RATING">Highest Customer Rating</option>
            </select>
          </div>
        </div>

        {/* Results Bar */}
        <div className="catalog-results-bar">
          <span>
            Showing <strong>{filtered.length}</strong> product(s)
            {category !== 'ALL' && ` in Category`}
            {brand !== 'ALL' && ` by selected Brand`}
          </span>
          {(category !== 'ALL' || brand !== 'ALL' || search) && (
            <button
              className="clear-filters-btn"
              onClick={() => {
                setCategory('ALL');
                setBrand('ALL');
                setSearch('');
              }}
            >
              Reset Filters ✕
            </button>
          )}
        </div>

        {/* Product Cards Grid */}
        {filtered.length === 0 ? (
          <div className="no-products-found">
            <span className="no-prod-icon">🔍</span>
            <h3>No Products Found</h3>
            <p>Try clearing your filters or searching for different keywords.</p>
            <button
              className="primary-button"
              onClick={() => {
                setCategory('ALL');
                setBrand('ALL');
                setSearch('');
              }}
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="catalog-grid">
            {filtered.map((product) => {
              const prodId = product.product_id || product.id;
              const isOut = (product.stock_qty || 0) <= 0;
              const isLow = !isOut && product.stock_qty <= (product.low_stock_threshold || 5);
              const catObj = categories.find((c) => c.category_id === product.category_id);
              const brdObj = brands.find((b) => b.brand_id === product.brand_id);

              return (
                <div key={prodId} className="catalog-product-card">
                  {/* Image Container with Badges */}
                  <div className="card-image-wrap">
                    <Link to={`/products/${prodId}`}>
                      <img src={product.image_url || product.image} alt={product.product_name || product.name} />
                    </Link>
                    {isOut ? (
                      <span className="stock-badge badge-out">Out of Stock</span>
                    ) : isLow ? (
                      <span className="stock-badge badge-low">Only {product.stock_qty} Left!</span>
                    ) : null}
                    <span className="category-chip">
                      {catObj ? catObj.category_name : product.category || 'General'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="card-body">
                    {brdObj && <span className="brand-chip">{brdObj.brand_name}</span>}

                    <h2 className="card-title">
                      <Link to={`/products/${prodId}`}>
                        {product.product_name || product.name}
                      </Link>
                    </h2>

                    <div className="card-rating-row">
                      <span className="rating-stars">{'★'.repeat(Math.round(product.rating || 5))}</span>
                      <span className="rating-num">({product.rating || 5.0})</span>
                    </div>

                    <p className="card-desc">
                      {product.description || 'Premium genuine product from ShopSphere online catalog.'}
                    </p>

                    <div className="card-price-action">
                      <div>
                        <span className="price-tag">Rs. {Number(product.price).toLocaleString()}</span>
                        <span className="stock-hint">
                          {isOut ? 'Unavailable' : `${product.stock_qty} in stock`}
                        </span>
                      </div>

                      <div className="card-buttons">
                        <Link to={`/products/${prodId}`} className="view-btn">
                          View
                        </Link>
                        <button
                          className="add-btn"
                          disabled={isOut}
                          onClick={() => addToCart(product)}
                        >
                          {isOut ? 'Sold Out' : '+ Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Products;