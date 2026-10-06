import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';

function ManagementHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'OVERVIEW';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Toast message
  const [toastMsg, setToastMsg] = useState('');

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productPriceError, setProductPriceError] = useState('');
  const [productForm, setProductForm] = useState({
    product_name: '',
    category_id: '',
    brand_id: '',
    price: '',
    stock_qty: '10',
    low_stock_threshold: '5',
    image_url: '',
    description: '',
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    category_name: '',
    description: '',
    icon: '🏷️',
  });

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandNameError, setBrandNameError] = useState('');
  const [brandForm, setBrandForm] = useState({
    brand_name: '',
    origin: '',
    description: '',
  });

  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoForm, setPromoForm] = useState({
    promotion_code: '',
    title: '',
    discount_type: 'PERCENTAGE',
    discount_value: '10',
    min_spend: '0',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '2026-12-31',
    description: '',
    status: 'ACTIVE',
  });

  // Filter & confirmation states
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState(null);
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState(null);
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState(null);
  const [confirmDeletePromoId, setConfirmDeletePromoId] = useState(null);
  const [confirmDeleteBrandId, setConfirmDeleteBrandId] = useState(null);

  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [prods, cats, brds, ords, promos, revs] = await Promise.all([
        api.getProducts(false),
        api.getCategories(),
        api.getBrands(),
        api.getOrders(),
        api.getPromotions(),
        api.getReviews(),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
      setBrands(brds || []);
      setOrders(ords || []);
      setPromotions(promos || []);
      setReviews(revs || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast(`⚠️ Server error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const switchTab = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Product Actions
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductPriceError('');
    setProductForm({
      product_name: '',
      category_id: categories[0]?.category_id || '',
      brand_id: brands[0]?.brand_id || '',
      price: '',
      stock_qty: '15',
      low_stock_threshold: '5',
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      description: '',
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductPriceError('');
    setProductForm({
      product_name: prod.product_name || prod.name || '',
      category_id: prod.category_id || '',
      brand_id: prod.brand_id || '',
      price: prod.price !== undefined ? String(prod.price) : '',
      stock_qty: prod.stock_qty || 0,
      low_stock_threshold: prod.low_stock_threshold || 5,
      image_url: prod.image_url || prod.image || '',
      description: prod.description || '',
    });
    setShowProductModal(true);
  };

  const handleProductPriceChange = (val) => {
    setProductForm((prev) => ({ ...prev, price: val }));
    if (val === '') {
      setProductPriceError('Price is required.');
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      setProductPriceError('Product price cannot be a negative number.');
    } else {
      setProductPriceError('');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.product_name?.trim()) {
      showToast('⚠️ Product name is required.');
      return;
    }

    const priceNum = parseFloat(productForm.price);
    if (productForm.price === '' || isNaN(priceNum) || priceNum < 0) {
      setProductPriceError('Product price cannot be a negative number.');
      showToast('⚠️ Product price cannot be a negative number.');
      return;
    }

    try {
      const payload = {
        ...productForm,
        price: priceNum,
      };
      if (editingProduct) {
        await api.updateProduct(editingProduct.product_id, payload);
        showToast(`✓ Product "${productForm.product_name}" updated successfully.`);
      } else {
        await api.createProduct(payload);
        showToast(`✓ New product "${productForm.product_name}" added to catalog.`);
      }
      setShowProductModal(false);
      refreshData();
    } catch (err) {
      const errMsg = err.message || 'Failed to save product';
      if (errMsg.toLowerCase().includes('negative')) {
        setProductPriceError(errMsg);
      }
      showToast(`⚠️ Failed to save product: ${errMsg}`);
    }
  };

  const handleDeleteProduct = async (productId, name) => {
    setConfirmDeleteProductId(null);
    setProducts((prev) => prev.filter((p) => p.product_id !== productId && p.id !== productId));
    try {
      await api.deleteProduct(productId);
      showToast(`✓ Product "${name}" removed from catalog.`);
      refreshData();
    } catch (err) {
      showToast(`⚠️ Failed to remove product: ${err.message}`);
      refreshData();
    }
  };

  const handleStockAdjust = async (productId, change) => {
    try {
      await api.adjustStock(productId, change);
      showToast(`✓ Stock level adjusted.`);
      refreshData();
    } catch (err) {
      showToast(`⚠️ Failed to adjust stock: ${err.message}`);
    }
  };

  // Category Actions
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ category_name: '', description: '', icon: '🏷️' });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      category_name: cat.category_name,
      description: cat.description || '',
      icon: cat.icon || '🏷️',
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.category_name) return;

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.category_id, categoryForm);
        showToast(`✓ Category "${categoryForm.category_name}" updated.`);
      } else {
        await api.createCategory(categoryForm);
        showToast(`✓ New category "${categoryForm.category_name}" created.`);
      }
      setShowCategoryModal(false);
      refreshData();
    } catch (err) {
      showToast(`⚠️ Failed to save category: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (catId, name) => {
    setConfirmDeleteCategoryId(null);
    setCategories((prev) => prev.filter((c) => c.category_id !== catId && c.id !== catId));
    try {
      await api.deleteCategory(catId);
      showToast(`✓ Category "${name}" deleted.`);
      refreshData();
    } catch (err) {
      showToast(`⚠️ Failed to delete category: ${err.message}`);
      refreshData();
    }
  };

  // Order Actions
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      showToast(`✓ Order #${orderId} status updated to ${newStatus}.`);
      refreshData();
    } catch (err) {
      showToast(`⚠️ Failed to update order: ${err.message}`);
    }
  };

  const handleAssignCourier = async (orderId, courierName) => {
    try {
      await api.updateOrderStatus(orderId, 'SHIPPED', courierName);
      showToast(`✓ Courier assigned. Order marked as SHIPPED.`);
      refreshData();
    } catch (err) {
      showToast(`⚠️ Failed to assign courier: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    setConfirmDeleteOrderId(null);
    try {
      await api.deleteOrder(orderId);
      showToast(`✓ Order #${orderId} deleted.`);
      refreshData();
    } catch (err) {
      showToast(`⚠️ Failed to delete order: ${err.message}`);
    }
  };

  // Promotion Actions
  const handleOpenCreatePromo = () => {
    setEditingPromo(null);
    setPromoForm({
      promotion_code: '',
      title: '',
      discount_type: 'PERCENTAGE',
      discount_value: '10',
      min_spend: '0',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '2026-12-31',
      description: '',
      status: 'ACTIVE',
    });
    setShowPromoModal(true);
  };

  const handleOpenEditPromo = (promo) => {
    setEditingPromo(promo);
    setPromoForm({
      promotion_code: promo.promotion_code || '',
      title: promo.title || '',
      discount_type: promo.discount_type || 'PERCENTAGE',
      discount_value: String(promo.discount_value ?? '10'),
      min_spend: String(promo.min_spend ?? '0'),
      start_date: promo.start_date || new Date().toISOString().split('T')[0],
      end_date: promo.end_date || '2026-12-31',
      description: promo.description || '',
      status: promo.status || 'ACTIVE',
    });
    setShowPromoModal(true);
  };

  const handleSavePromotion = async (e) => {
    e.preventDefault();
    if (!promoForm.promotion_code) return;
    try {
      const payload = {
        ...promoForm,
        discount_value: parseFloat(promoForm.discount_value) || 0,
        min_spend: parseFloat(promoForm.min_spend) || 0,
      };
      if (editingPromo) {
        await api.updatePromotion(editingPromo.promotion_id, payload);
        showToast(`✓ Promotion "${promoForm.promotion_code}" updated successfully.`);
      } else {
        await api.createPromotion(payload);
        showToast(`✓ Promotion "${promoForm.promotion_code}" created.`);
      }
      setShowPromoModal(false);
      refreshData();
    } catch (err) {
      showToast(`⚠️ Failed to save promotion: ${err.message}`);
    }
  };

  const handleTogglePromoStatus = async (promo) => {
    const nextStatus = promo.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updatePromotion(promo.promotion_id, { ...promo, status: nextStatus });
      showToast(`✓ Promotion "${promo.promotion_code}" set to ${nextStatus}.`);
      refreshData();
    } catch (err) {
      showToast(`⚠️ Failed to toggle promotion: ${err.message}`);
    }
  };

  const handleDeletePromo = async (promoId, code) => {
    setConfirmDeletePromoId(null);
    try {
      await api.deletePromotion(promoId);
      showToast(`✓ Promotion "${code}" removed.`);
      refreshData();
    } catch (err) {
      showToast(`⚠️ Failed to delete promotion: ${err.message}`);
    }
  };

  // Brand Actions
  const handleOpenAddBrand = () => {
    setEditingBrand(null);
    setBrandNameError('');
    setBrandForm({ brand_name: '', origin: '', description: '' });
    setShowBrandModal(true);
  };

  const handleOpenEditBrand = (brand) => {
    setEditingBrand(brand);
    setBrandNameError('');
    setBrandForm({
      brand_name: brand.brand_name,
      origin: brand.origin || '',
      description: brand.description || '',
    });
    setShowBrandModal(true);
  };

  const validateBrandName = (name, currentEditing = editingBrand) => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      return 'Brand name is required.';
    }
    const currentId = currentEditing ? (currentEditing.brand_id || currentEditing.id) : null;
    const isDuplicate = brands.some((b) => {
      const bId = b.brand_id || b.id;
      if (currentId && bId === currentId) return false;
      return b.brand_name && b.brand_name.trim().toLowerCase() === trimmed.toLowerCase();
    });
    if (isDuplicate) {
      return `Brand name "${trimmed}" already exists. Brand names must be unique.`;
    }
    return '';
  };

  const handleBrandNameChange = (val) => {
    setBrandForm((prev) => ({ ...prev, brand_name: val }));
    const error = validateBrandName(val);
    setBrandNameError(error);
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    const trimmedName = (brandForm.brand_name || '').trim();
    const error = validateBrandName(trimmedName);
    if (error) {
      setBrandNameError(error);
      showToast(`⚠️ ${error}`);
      return;
    }

    try {
      if (editingBrand) {
        await api.updateBrand(editingBrand.brand_id || editingBrand.id, {
          ...brandForm,
          brand_name: trimmedName,
        });
        showToast(`✓ Brand "${trimmedName}" updated.`);
      } else {
        await api.createBrand({
          ...brandForm,
          brand_name: trimmedName,
        });
        showToast(`✓ Brand "${trimmedName}" added.`);
      }
      setShowBrandModal(false);
      refreshData();
    } catch (err) {
      const errMsg = err.message || 'Failed to save brand';
      if (errMsg.toLowerCase().includes('unique') || errMsg.toLowerCase().includes('already exist')) {
        setBrandNameError(errMsg);
      }
      showToast(`⚠️ Failed to save brand: ${errMsg}`);
    }
  };

  const handleDeleteBrand = async (brandId, name) => {
    setConfirmDeleteBrandId(null);
    setBrands((prev) => prev.filter((b) => b.brand_id !== brandId && b.id !== brandId));
    try {
      await api.deleteBrand(brandId);
      showToast(`✓ Brand "${name}" deleted.`);
      refreshData();
    } catch (err) {
      showToast(`⚠️ Failed to delete brand: ${err.message}`);
      refreshData();
    }
  };

  // Review Actions
  const handleDeleteReview = async (reviewId) => {
    setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
    setConfirmDeleteReviewId(null);
    try {
      await api.deleteReview(reviewId);
      showToast('✓ Review deleted.');
      refreshData();
    } catch (err) {
      console.warn('Failed to delete review on server:', err);
      showToast('✓ Review removed.');
      refreshData();
    }
  };

  // Filters
  const filteredProducts = products.filter((p) =>
    (p.product_name || p.name || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter((o) =>
    orderStatusFilter === 'ALL' ? true : o.status === orderStatusFilter
  );

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.total_amount || o.total || 0), 0);
  const lowStockCount = products.filter(
    (p) => p.stock_qty <= (p.low_stock_threshold || 5)
  ).length;

  const user = JSON.parse(localStorage.getItem('shopSphereUser') || 'null');
  const loggedIn = localStorage.getItem('shopSphereLoggedIn') === 'true';
  const isAdmin = Boolean(
    loggedIn && user &&
    (user.role === 'ADMINISTRATOR' ||
     user.role === 'ADMIN' ||
     user.role === 'STORE_MANAGER' ||
     user.role === 'MANAGER')
  );

  if (!isAdmin) {
    return (
      <div className="hub-restricted-container">
        <div className="hub-restricted-box">
          <div className="restricted-badge">🔒 Access Restricted</div>
          <h2>Administrator Privilege Required</h2>
          <p>
            {loggedIn && user
              ? `You are currently signed in as a Customer (${user.email || user.name}). The Store Management Hub is reserved exclusively for Administrator and Store Management staff.`
              : 'You are currently not signed in. The Store Management Hub is reserved exclusively for Administrator and Store Management staff.'}
          </p>
          <div className="restricted-btn-row">
            <Link to="/login" className="primary-button">
              Sign In as Admin →
            </Link>
            <Link to="/" className="secondary-button">
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="management-hub-page">
      {toastMsg && <div className="hub-toast-banner">{toastMsg}</div>}

      <div className="hub-container">
        {/* Hub Header */}
        <div className="hub-header">
          <div>
            <span className="hub-badge">Merchant & Operations Console</span>
            <h1>ShopSphere Store Management</h1>
            <p className="hub-subtitle">
              Manage product listings, inventory levels, customer orders, promotions, and reviews in one place.
            </p>
          </div>
          <div className="hub-header-actions">
            <Link to="/products" className="view-storefront-btn">
              🛍️ Visit Storefront →
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hub-tabs-nav">
          <button
            className={`hub-tab-btn ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
            onClick={() => switchTab('OVERVIEW')}
          >
            📊 Dashboard
          </button>
          <button
            className={`hub-tab-btn ${activeTab === 'PRODUCTS' ? 'active' : ''}`}
            onClick={() => switchTab('PRODUCTS')}
          >
            📦 Products & Stock
            {lowStockCount > 0 && <span className="tab-pill alert">{lowStockCount} low</span>}
          </button>
          <button
            className={`hub-tab-btn ${activeTab === 'CATEGORIES' ? 'active' : ''}`}
            onClick={() => switchTab('CATEGORIES')}
          >
            📁 Categories
          </button>
          <button
            className={`hub-tab-btn ${activeTab === 'ORDERS' ? 'active' : ''}`}
            onClick={() => switchTab('ORDERS')}
          >
            📋 Orders & Fulfillment
            <span className="tab-pill">{orders.length}</span>
          </button>
          <button
            className={`hub-tab-btn ${activeTab === 'PROMOTIONS' ? 'active' : ''}`}
            onClick={() => switchTab('PROMOTIONS')}
          >
            🏷️ Discounts & Coupons
          </button>
          <button
            className={`hub-tab-btn ${activeTab === 'BRANDS' ? 'active' : ''}`}
            onClick={() => switchTab('BRANDS')}
          >
            🏢 Brands
          </button>
          <button
            className={`hub-tab-btn ${activeTab === 'REVIEWS' ? 'active' : ''}`}
            onClick={() => switchTab('REVIEWS')}
          >
            ⭐ Customer Reviews
            <span className="tab-pill">{reviews.length}</span>
          </button>
          <button
            className={`hub-tab-btn ${activeTab === 'DELIVERY' ? 'active' : ''}`}
            onClick={() => switchTab('DELIVERY')}
          >
            🚚 Deliveries
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW                                           */}
        {/* ========================================================= */}
        {activeTab === 'OVERVIEW' && (
          <div className="tab-content">
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-icon">💰</span>
                <div>
                  <span className="metric-label">Gross Revenue</span>
                  <h3>Rs. {totalRevenue.toLocaleString()}</h3>
                  <p className="metric-sub">{orders.length} orders fulfilled</p>
                </div>
              </div>
              <div className="metric-card">
                <span className="metric-icon">📦</span>
                <div>
                  <span className="metric-label">Active Products</span>
                  <h3>{products.length}</h3>
                  <p className="metric-sub">{lowStockCount} items need restock</p>
                </div>
              </div>
              <div className="metric-card">
                <span className="metric-icon">🏷️</span>
                <div>
                  <span className="metric-label">Active Campaigns</span>
                  <h3>{promotions.filter((p) => p.status === 'ACTIVE').length}</h3>
                  <p className="metric-sub">Coupons live in store</p>
                </div>
              </div>
              <div className="metric-card">
                <span className="metric-icon">⭐</span>
                <div>
                  <span className="metric-label">Customer Reviews</span>
                  <h3>{reviews.length}</h3>
                  <p className="metric-sub">Published ratings in store</p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Orders */}
            <div className="hub-card">
              <div className="hub-card-header">
                <div>
                  <h3>Recent Customer Orders</h3>
                  <p>Latest purchases placed through the online shopping mall:</p>
                </div>
                <button className="table-action-btn" onClick={() => switchTab('ORDERS')}>
                  View All Orders →
                </button>
              </div>
              <div className="table-responsive">
                <table className="hub-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Total Amount</th>
                      <th>Payment</th>
                      <th>Fulfillment</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((ord) => (
                      <tr key={ord.order_id}>
                        <td><strong>#{ord.order_id}</strong></td>
                        <td>{ord.customer_name || ord.customer?.firstName}</td>
                        <td>{new Date(ord.order_date).toLocaleDateString()}</td>
                        <td><strong className="text-purple">Rs. {Number(ord.total_amount || ord.total).toLocaleString()}</strong></td>
                        <td><span className="status-pill success">{ord.payment_method}</span></td>
                        <td>
                          <span className={`status-tag status-${ord.status.toLowerCase()}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/order/${ord.order_id}`} className="view-tracking-btn">
                            Track Order →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PRODUCTS & STOCK                                   */}
        {/* ========================================================= */}
        {activeTab === 'PRODUCTS' && (
          <div className="tab-content">
            <div className="persona-banner">
              <div>
                <span className="persona-tag">Inventory Center</span>
                <h2>Product Catalog & Stock Management</h2>
                <p>Add new products, adjust inventory quantities, update prices, and maintain store listings.</p>
              </div>
              <button className="primary-action-btn" onClick={handleOpenAddProduct}>
                + Add New Product
              </button>
            </div>

            <div className="hub-filters-row">
              <input
                type="text"
                placeholder="Search products by title..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="hub-search-input"
              />
              <span className="count-tag">Showing {filteredProducts.length} items</span>
            </div>

            <div className="table-responsive">
              <table className="hub-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Stock Qty</th>
                    <th>Inventory Status</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isLow = p.stock_qty <= (p.low_stock_threshold || 5);
                    const isOut = p.stock_qty <= 0;
                    const cat = categories.find((c) => c.category_id === p.category_id)?.category_name || p.category;
                    const brd = brands.find((b) => b.brand_id === p.brand_id)?.brand_name || 'Generic';

                    return (
                      <tr key={p.product_id || p.id}>
                        <td>
                          <div className="prod-table-cell">
                            <img src={p.image_url || p.image} alt={p.product_name || p.name} />
                            <div>
                              <strong>{p.product_name || p.name}</strong>
                              <span className="sub-text">SKU: {p.product_id || p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className="table-category-pill">{cat}</span></td>
                        <td><strong>{brd}</strong></td>
                        <td>Rs. {Number(p.price).toLocaleString()}</td>
                        <td>
                          <div className="stock-control-cell">
                            <button className="stock-step-btn" onClick={() => handleStockAdjust(p.product_id, -1)}>−</button>
                            <span className="stock-num">{p.stock_qty}</span>
                            <button className="stock-step-btn" onClick={() => handleStockAdjust(p.product_id, 1)}>+</button>
                          </div>
                        </td>
                        <td>
                          {isOut ? (
                            <span className="alert-badge out">Out of Stock</span>
                          ) : isLow ? (
                            <span className="alert-badge low">Low Stock (&le;{p.low_stock_threshold || 5})</span>
                          ) : (
                            <span className="alert-badge good">Available</span>
                          )}
                        </td>
                        <td>
                          <span className="status-pill success">{p.status || 'ACTIVE'}</span>
                        </td>
                        <td>
                          <div className="table-actions-group">
                            <button
                              className="edit-btn"
                              onClick={() => handleOpenEditProduct(p)}
                            >
                              ✏️ Edit
                            </button>
                            {confirmDeleteProductId === p.product_id ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                  className="delete-btn"
                                  style={{ background: '#dc2626', color: '#fff', padding: '6px 8px', fontSize: '11px', fontWeight: 700 }}
                                  onClick={() => handleDeleteProduct(p.product_id, p.product_name || p.name)}
                                >
                                  Confirm?
                                </button>
                                <button
                                  className="edit-btn"
                                  style={{ padding: '6px 8px', fontSize: '11px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                                  onClick={() => setConfirmDeleteProductId(null)}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                className="delete-btn"
                                onClick={() => setConfirmDeleteProductId(p.product_id)}
                              >
                                🗑️ Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CATEGORIES                                         */}
        {/* ========================================================= */}
        {activeTab === 'CATEGORIES' && (
          <div className="tab-content">
            <div className="persona-banner">
              <div>
                <span className="persona-tag">Catalog Structure</span>
                <h2>Product Categories</h2>
                <p>Organize products into intuitive categories to help customers discover items faster.</p>
              </div>
              <button className="primary-action-btn" onClick={handleOpenAddCategory}>
                + Add Category
              </button>
            </div>

            <div className="category-cards-grid">
              {categories.map((c) => {
                const count = products.filter((p) => p.category_id === c.category_id).length;

                return (
                  <div key={c.category_id} className="hub-item-card">
                    <div className="hub-item-top">
                      <span className="cat-large-icon">{c.icon || '🏷️'}</span>
                      <div className="hub-item-actions">
                        <button className="icon-btn edit" onClick={() => handleOpenEditCategory(c)}>✏️</button>
                        {confirmDeleteCategoryId === c.category_id ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                              onClick={() => handleDeleteCategory(c.category_id, c.category_name)}
                            >
                              Delete?
                            </button>
                            <button
                              style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                              onClick={() => setConfirmDeleteCategoryId(null)}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button className="icon-btn delete" onClick={() => setConfirmDeleteCategoryId(c.category_id)}>🗑️</button>
                        )}
                      </div>
                    </div>
                    <h3>{c.category_name}</h3>
                    <p className="item-desc">{c.description || 'No description provided.'}</p>
                    <div className="item-meta-footer">
                      <span>Products: <strong>{count}</strong></span>
                      <span className="status-pill success">Active</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ORDERS & FULFILLMENT                               */}
        {/* ========================================================= */}
        {activeTab === 'ORDERS' && (
          <div className="tab-content">
            <div className="persona-banner">
              <div>
                <span className="persona-tag">Order Center</span>
                <h2>Orders & Fulfillment Management</h2>
                <p>Track customer purchases, update order stages, assign couriers, and manage customer shipments.</p>
              </div>
            </div>

            <div className="hub-filters-row">
              <div className="filter-group">
                <label>Filter Status:</label>
                <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <span className="count-tag">{filteredOrders.length} order(s)</span>
            </div>

            <div className="table-responsive">
              <table className="hub-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Fulfillment Status</th>
                    <th>Courier</th>
                    <th>Track</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.order_id}>
                      <td>
                        <strong>#{o.order_id}</strong>
                        <span className="sub-text">{new Date(o.order_date).toLocaleDateString()}</span>
                      </td>
                      <td>
                        <strong>{o.customer_name || `${o.customer?.firstName || ''} ${o.customer?.lastName || ''}`}</strong>
                        <p className="sub-text">{o.shipping_address || o.customer?.address}, {o.city || o.customer?.city}</p>
                      </td>
                      <td>
                        <div className="order-items-compact">
                          {(o.order_items || o.items || []).map((it, idx) => (
                            <span key={idx} className="item-chip">
                              {it.product_name || it.name} (x{it.quantity})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <strong className="text-purple">Rs. {Number(o.total_amount || o.total).toLocaleString()}</strong>
                      </td>
                      <td>
                        <span className={`status-pill ${o.payment_status === 'COMPLETED' ? 'success' : 'warning'}`}>
                          {o.payment_method || 'COD'}
                        </span>
                      </td>
                      <td>
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.order_id, e.target.value)}
                          className={`status-select status-${o.status.toLowerCase()}`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td>
                        {o.staff_name ? (
                          <span className="courier-pill">🚚 {o.staff_name}</span>
                        ) : (
                          <button
                            className="assign-courier-btn"
                            onClick={() => handleAssignCourier(o.order_id, 'Express Courier (Sunil)')}
                          >
                            + Assign Courier
                          </button>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <Link to={`/order/${o.order_id}`} className="view-tracking-btn">
                            View →
                          </Link>
                          {confirmDeleteOrderId === o.order_id ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                onClick={() => handleDeleteOrder(o.order_id)}
                              >
                                Del?
                              </button>
                              <button
                                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', cursor: 'pointer' }}
                                onClick={() => setConfirmDeleteOrderId(null)}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              className="delete-btn"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                              onClick={() => setConfirmDeleteOrderId(o.order_id)}
                              title="Delete Order"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: PROMOTIONS & COUPONS                               */}
        {/* ========================================================= */}
        {activeTab === 'PROMOTIONS' && (
          <div className="tab-content">
            <div className="persona-banner">
              <div>
                <span className="persona-tag">Marketing & Offers</span>
                <h2>Discount Codes & Campaigns</h2>
                <p>Create promotional coupon codes, configure discount values, and drive store sales.</p>
              </div>
              <button className="primary-action-btn" onClick={handleOpenCreatePromo}>
                + Create Promo Code
              </button>
            </div>

            <div className="promotions-grid">
              {promotions.map((p) => {
                const isActive = p.status === 'ACTIVE';

                return (
                  <div key={p.promotion_id} className={`promo-card ${isActive ? 'active' : 'inactive'}`}>
                    <div className="promo-card-top">
                      <span className="promo-code-badge">{p.promotion_code}</span>
                      <span className={`status-pill ${isActive ? 'success' : 'warning'}`}>
                        {p.status}
                      </span>
                    </div>

                    <h3>{p.title}</h3>
                    <p className="promo-desc">{p.description}</p>

                    <div className="promo-value-box">
                      <span className="promo-discount-num">
                        {p.discount_type === 'PERCENTAGE' ? `${p.discount_value}% OFF` : `Rs. ${p.discount_value} OFF`}
                      </span>
                      {p.min_spend > 0 && (
                        <span className="promo-min-spend">
                          Min. spend: Rs. {Number(p.min_spend).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="promo-meta-row">
                      <span>Valid: {p.start_date} to {p.end_date}</span>
                      <span className="promo-rule-pill" style={{ marginLeft: 'auto', background: '#e0f2fe', color: '#0369a1', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                        🔒 1-Time Use / Customer
                      </span>
                    </div>

                    <div className="promo-card-actions">
                      <button
                        className="toggle-status-btn"
                        onClick={() => handleTogglePromoStatus(p)}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="edit-promo-btn"
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: '#1e293b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={() => handleOpenEditPromo(p)}
                      >
                        ✏️ Edit
                      </button>
                      {confirmDeletePromoId === p.promotion_id ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                            onClick={() => handleDeletePromo(p.promotion_id, p.promotion_code)}
                          >
                            Confirm?
                          </button>
                          <button
                            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', cursor: 'pointer' }}
                            onClick={() => setConfirmDeletePromoId(null)}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          className="delete-btn"
                          onClick={() => setConfirmDeletePromoId(p.promotion_id)}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: BRANDS                                             */}
        {/* ========================================================= */}
        {activeTab === 'BRANDS' && (
          <div className="tab-content">
            <div className="persona-banner">
              <div>
                <span className="persona-tag">Brand Directory</span>
                <h2>Verified Mall Brands</h2>
                <p>Manage brand partnerships, official manufacturers, and certified suppliers.</p>
              </div>
              <button className="primary-action-btn" onClick={handleOpenAddBrand}>
                + Add Brand
              </button>
            </div>

            <div className="brands-cards-grid">
              {brands.map((b) => {
                const count = products.filter((p) => p.brand_id === b.brand_id).length;

                return (
                  <div key={b.brand_id} className="hub-item-card">
                    <div className="hub-item-top">
                      <div className="brand-logo-sim">{b.brand_name.charAt(0)}</div>
                      <div className="hub-item-actions">
                        <button className="icon-btn edit" onClick={() => handleOpenEditBrand(b)}>✏️</button>
                        {confirmDeleteBrandId === b.brand_id ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                              onClick={() => handleDeleteBrand(b.brand_id, b.brand_name)}
                            >
                              Delete?
                            </button>
                            <button
                              style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                              onClick={() => setConfirmDeleteBrandId(null)}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button className="icon-btn delete" onClick={() => setConfirmDeleteBrandId(b.brand_id)}>🗑️</button>
                        )}
                      </div>
                    </div>
                    <h3>{b.brand_name}</h3>
                    <span className="brand-origin-tag">📍 {b.origin || 'International'}</span>
                    <p className="item-desc">{b.description || 'Verified partner brand.'}</p>
                    <div className="item-meta-footer">
                      <span>Products: <strong>{count}</strong></span>
                      <span className="status-pill success">Verified</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: REVIEWS                                            */}
        {/* ========================================================= */}
        {activeTab === 'REVIEWS' && (
          <div className="tab-content">
            <div className="persona-banner">
              <div>
                <span className="persona-tag">Customer Feedback</span>
                <h2>Customer Ratings & Reviews</h2>
                <p>All reviews are automatically published directly to product pages. Administrators do not need to approve reviews; only the option to delete inappropriate or spam reviews is available.</p>
              </div>
            </div>

            <div className="reviews-moderation-list">
              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <span style={{ fontSize: '2.5rem' }}>⭐</span>
                  <h3 style={{ marginTop: '0.5rem', color: '#1e293b' }}>No Customer Reviews Yet</h3>
                  <p style={{ color: '#64748b' }}>Reviews submitted by shoppers on product pages are automatically published here. Administrators can delete any review if needed.</p>
                </div>
              ) : (
                reviews.map((r) => {
                  const prod = products.find((p) => p.product_id === r.product_id || p.id === r.product_id);

                  return (
                    <div key={r.review_id} className="moderation-card approved">
                      <div className="mod-card-header">
                        <div>
                          <strong>{r.customer_name}</strong>
                          <span className="sub-text"> on </span>
                          <strong className="text-purple">{prod ? (prod.product_name || prod.name) : 'Product #' + r.product_id}</strong>
                        </div>
                        <div className="mod-head-right">
                          <span className="review-stars">{'★'.repeat(r.rating || 5)}</span>
                          <span className="status-pill success">Published</span>
                        </div>
                      </div>

                      <p className="mod-comment">"{r.comment}"</p>
                      <span className="mod-date">Submitted: {new Date(r.review_date).toLocaleString()}</span>

                      <div className="mod-actions-row">
                        {confirmDeleteReviewId === r.review_id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '3px 8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#b91c1c' }}>Delete permanently?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(r.review_id)}
                              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Yes, Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteReviewId(null)}
                              style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', color: '#475569' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="delete-spam-btn"
                            onClick={() => setConfirmDeleteReviewId(r.review_id)}
                          >
                            🗑️ Delete Review
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: DELIVERY                                           */}
        {/* ========================================================= */}
        {activeTab === 'DELIVERY' && (
          <div className="tab-content">
            <div className="persona-banner">
              <div>
                <span className="persona-tag">Logistics & Dispatch</span>
                <h2>Shipment Courier Management</h2>
                <p>Delivery assignments, status updates, and proof of receipt for orders.</p>
              </div>
            </div>

            <div className="delivery-orders-list">
              {orders.map((o) => (
                <div key={o.order_id} className="delivery-assignment-card">
                  <div className="del-head">
                    <div>
                      <strong>Order #{o.order_id}</strong>
                      <p>Recipient: {o.customer_name || `${o.customer?.firstName} ${o.customer?.lastName}`}</p>
                    </div>
                    <span className={`status-pill ${o.status === 'DELIVERED' ? 'success' : 'warning'}`}>
                      {o.status}
                    </span>
                  </div>
                  <p className="del-address">📍 Address: {o.shipping_address || o.customer?.address}, {o.city || o.customer?.city}</p>
                  <p className="del-contact">📞 Phone: {o.customer_phone || o.customer?.phone || '0778901234'}</p>
                  <div className="del-actions">
                    <button
                      className="status-btn shipped"
                      onClick={() => handleUpdateOrderStatus(o.order_id, 'SHIPPED')}
                    >
                      🚚 Mark Out for Delivery
                    </button>
                    <button
                      className="status-btn delivered"
                      onClick={() => handleUpdateOrderStatus(o.order_id, 'DELIVERED')}
                    >
                      ✓ Confirm Delivered
                    </button>
                    <Link to={`/order/${o.order_id}`} className="view-tracking-btn">
                      View Route & Receipt →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {showProductModal && (
        <div className="hub-modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="hub-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="close-btn" onClick={() => setShowProductModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveProduct} className="modal-form">
              <div className="form-group">
                <label>Product Title / Name:</label>
                <input
                  type="text"
                  required
                  value={productForm.product_name}
                  onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Category:</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Brand:</label>
                  <select
                    value={productForm.brand_id}
                    onChange={(e) => setProductForm({ ...productForm, brand_id: e.target.value })}
                  >
                    {brands.map((b) => (
                      <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Price (LKR): <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => handleProductPriceChange(e.target.value)}
                    placeholder="12999"
                    style={productPriceError ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                  />
                  {productPriceError && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      ⚠️ {productPriceError}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Stock Qty:</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock_qty}
                    onChange={(e) => setProductForm({ ...productForm, stock_qty: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Low Stock Alert At:</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.low_stock_threshold}
                    onChange={(e) => setProductForm({ ...productForm, low_stock_threshold: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image URL:</label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Detailed specifications and highlights..."
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowProductModal(false)}>Cancel</button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={Boolean(productPriceError) || productForm.price === '' || parseFloat(productForm.price) < 0}
                  style={productPriceError || productForm.price === '' || parseFloat(productForm.price) < 0 ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT CATEGORY */}
      {showCategoryModal && (
        <div className="hub-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="hub-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button className="close-btn" onClick={() => setShowCategoryModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCategory} className="modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Category Name:</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.category_name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
                    placeholder="e.g. Sports & Fitness"
                  />
                </div>
                <div className="form-group">
                  <label>Icon Emoji:</label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    placeholder="⚽"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  rows="3"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Describe items in this category..."
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                <button type="submit" className="save-btn">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT BRAND */}
      {showBrandModal && (
        <div className="hub-modal-overlay" onClick={() => setShowBrandModal(false)}>
          <div className="hub-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingBrand ? 'Edit Brand' : 'Add Brand'}</h3>
              <button className="close-btn" onClick={() => setShowBrandModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveBrand} className="modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Brand Name: <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    required
                    value={brandForm.brand_name}
                    onChange={(e) => handleBrandNameChange(e.target.value)}
                    placeholder="e.g. Puma"
                    style={brandNameError ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                  />
                  {brandNameError && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      ⚠️ {brandNameError}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Origin Country:</label>
                  <input
                    type="text"
                    value={brandForm.origin}
                    onChange={(e) => setBrandForm({ ...brandForm, origin: e.target.value })}
                    placeholder="e.g. Germany"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Brand Description:</label>
                <textarea
                  rows="3"
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  placeholder="Brand background and official certification..."
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowBrandModal(false)}>Cancel</button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={Boolean(brandNameError) || !brandForm.brand_name?.trim()}
                  style={brandNameError || !brandForm.brand_name?.trim() ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE / EDIT PROMOTION */}
      {showPromoModal && (
        <div className="hub-modal-overlay" onClick={() => setShowPromoModal(false)}>
          <div className="hub-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingPromo ? 'Edit Promotion Campaign' : 'Create Promotional Coupon Code'}</h3>
              <button className="close-btn" onClick={() => setShowPromoModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSavePromotion} className="modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Coupon Code:</label>
                  <input
                    type="text"
                    required
                    value={promoForm.promotion_code}
                    onChange={(e) => setPromoForm({ ...promoForm, promotion_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SAVE25"
                  />
                </div>
                <div className="form-group">
                  <label>Campaign Title:</label>
                  <input
                    type="text"
                    required
                    value={promoForm.title}
                    onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                    placeholder="e.g. Weekend Special Deal"
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Discount Type:</label>
                  <select
                    value={promoForm.discount_type}
                    onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value:</label>
                  <input
                    type="number"
                    required
                    value={promoForm.discount_value}
                    onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Min. Order (Rs.):</label>
                  <input
                    type="number"
                    value={promoForm.min_spend}
                    onChange={(e) => setPromoForm({ ...promoForm, min_spend: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Start Date:</label>
                  <input
                    type="date"
                    required
                    value={promoForm.start_date}
                    onChange={(e) => setPromoForm({ ...promoForm, start_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date:</label>
                  <input
                    type="date"
                    required
                    value={promoForm.end_date}
                    onChange={(e) => setPromoForm({ ...promoForm, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  rows="2"
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  placeholder="Terms and conditions for this offer..."
                ></textarea>
              </div>

              {editingPromo && (
                <div className="form-group">
                  <label>Status:</label>
                  <select
                    value={promoForm.status || 'ACTIVE'}
                    onChange={(e) => setPromoForm({ ...promoForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowPromoModal(false)}>Cancel</button>
                <button type="submit" className="save-btn">{editingPromo ? 'Save Changes' : 'Create Campaign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagementHub;
