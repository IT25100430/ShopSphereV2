import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const ORDER_STAGES = [
  { key: 'PENDING', label: 'Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
];

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Search, Filter & Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCopyOrderId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      await api.cancelOrder(orderId, 'Cancelled by customer');
      setToastMsg(`✓ Order #${orderId} has been cancelled successfully.`);
      setTimeout(() => setToastMsg(''), 5000);
      setConfirmCancelId(null);
      await loadOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setToastMsg(`⚠️ Failed to cancel order: ${err.message}`);
      setTimeout(() => setToastMsg(''), 5000);
    } finally {
      setCancellingId(null);
    }
  };

  // Metrics calculations
  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) =>
      ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)
    ).length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;
    const totalSpent = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((acc, o) => acc + Number(o.total_amount || o.total || 0), 0);

    return { total, active, delivered, cancelled, totalSpent };
  }, [orders]);

  // Filtering and Sorting
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    // Status filter
    if (statusFilter === 'ACTIVE') {
      list = list.filter((o) =>
        ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)
      );
    } else if (statusFilter === 'DELIVERED') {
      list = list.filter((o) => o.status === 'DELIVERED');
    } else if (statusFilter === 'CANCELLED') {
      list = list.filter((o) => o.status === 'CANCELLED');
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((o) => {
        const matchId = String(o.order_id || '').toLowerCase().includes(q);
        const matchDest = String(o.shipping_address || o.city || '').toLowerCase().includes(q);
        const matchItem = (o.order_items || o.items || []).some((it) =>
          String(it.product_name || it.name || '').toLowerCase().includes(q)
        );
        return matchId || matchDest || matchItem;
      });
    }

    // Sorting
    list.sort((a, b) => {
      const dateA = new Date(a.order_date || 0).getTime();
      const dateB = new Date(b.order_date || 0).getTime();
      const amountA = Number(a.total_amount || a.total || 0);
      const amountB = Number(b.total_amount || b.total || 0);

      if (sortBy === 'NEWEST') return dateB - dateA;
      if (sortBy === 'OLDEST') return dateA - dateB;
      if (sortBy === 'HIGHEST_AMOUNT') return amountB - amountA;
      if (sortBy === 'LOWEST_AMOUNT') return amountA - amountB;
      return 0;
    });

    return list;
  }, [orders, statusFilter, searchTerm, sortBy]);

  // Pagination slice
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  const getProgressIndex = (status) => {
    const idx = ORDER_STAGES.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="my-orders-page">
      <div className="my-orders-container">
        {/* TOP HEADER */}
        <div className="my-orders-header">
          <div>
            <span className="orders-badge-pill">🛍️ CUSTOMER DASHBOARD</span>
            <h1>Purchase History & Order Tracking</h1>
            <p className="orders-subtitle">
              Monitor real-time fulfillment, manage order cancellations, and download receipts.
            </p>
          </div>
          <div className="header-actions">
            <Link to="/products" className="browse-catalog-btn">
              Explore Products →
            </Link>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="orders-stats-grid">
          <div className="stat-card-glass stat-total">
            <div className="stat-icon-wrap">📦</div>
            <div>
              <span className="stat-label">Total Placed Orders</span>
              <h3 className="stat-number">{stats.total}</h3>
            </div>
          </div>

          <div className="stat-card-glass stat-active">
            <div className="stat-icon-wrap">🚚</div>
            <div>
              <span className="stat-label">In Progress / Transit</span>
              <h3 className="stat-number">{stats.active}</h3>
            </div>
          </div>

          <div className="stat-card-glass stat-delivered">
            <div className="stat-icon-wrap">🎉</div>
            <div>
              <span className="stat-label">Delivered Orders</span>
              <h3 className="stat-number">{stats.delivered}</h3>
            </div>
          </div>

          <div className="stat-card-glass stat-spent">
            <div className="stat-icon-wrap">💳</div>
            <div>
              <span className="stat-label">Lifetime Spend</span>
              <h3 className="stat-number">Rs. {Math.round(stats.totalSpent).toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* TOAST MESSAGE */}
        {toastMsg && (
          <div className="orders-toast-banner">
            <span>{toastMsg}</span>
          </div>
        )}

        {/* INTERACTIVE CONTROLS TOOLBAR */}
        <div className="orders-toolbar-card">
          {/* Status Tabs */}
          <div className="orders-filter-tabs">
            <button
              className={`filter-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
            >
              All Orders <span className="tab-count">{stats.total}</span>
            </button>
            <button
              className={`filter-tab ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('ACTIVE');
                setCurrentPage(1);
              }}
            >
              In Transit <span className="tab-count">{stats.active}</span>
            </button>
            <button
              className={`filter-tab ${statusFilter === 'DELIVERED' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('DELIVERED');
                setCurrentPage(1);
              }}
            >
              Delivered <span className="tab-count">{stats.delivered}</span>
            </button>
            <button
              className={`filter-tab ${statusFilter === 'CANCELLED' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('CANCELLED');
                setCurrentPage(1);
              }}
            >
              Cancelled <span className="tab-count">{stats.cancelled}</span>
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="orders-toolbar-right">
            <div className="orders-search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by Order ID, product, or city..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                  ✕
                </button>
              )}
            </div>

            <div className="orders-sort-wrapper">
              <label>Sort:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="NEWEST">Newest Placed</option>
                <option value="OLDEST">Oldest Placed</option>
                <option value="HIGHEST_AMOUNT">Highest Total</option>
                <option value="LOWEST_AMOUNT">Lowest Total</option>
              </select>
            </div>
          </div>
        </div>

        {/* ORDERS LISTING */}
        {loading ? (
          <div className="orders-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-orders-card">
            <span className="empty-icon">{searchTerm ? '🔍' : '📦'}</span>
            <h2>{searchTerm ? 'No Matching Orders' : 'No Orders Found'}</h2>
            <p>
              {searchTerm
                ? `No orders matched your search "${searchTerm}". Try a different keyword or filter.`
                : 'You have not placed any orders yet. Start exploring our wide catalog of products!'}
            </p>
            {searchTerm ? (
              <button
                className="primary-button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
              >
                Reset All Filters
              </button>
            ) : (
              <Link to="/products" className="primary-button">
                Start Shopping Now
              </Link>
            )}
          </div>
        ) : (
          <div className="orders-list">
            <div className="results-summary-strip">
              <span>
                Showing <strong>{paginatedOrders.length}</strong> of{' '}
                <strong>{filteredOrders.length}</strong> order(s)
              </span>
              {totalPages > 1 && (
                <span>
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
              )}
            </div>

            {paginatedOrders.map((ord) => {
              const isCancelled = ord.status === 'CANCELLED';
              const isDelivered = ord.status === 'DELIVERED';
              const isActive = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(ord.status);
              const progressIdx = getProgressIndex(ord.status);
              const items = ord.order_items || ord.items || [];
              const itemCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0);

              return (
                <div
                  key={ord.order_id}
                  className={`order-card-refined ${
                    isCancelled ? 'card-cancelled' : isDelivered ? 'card-delivered' : 'card-active'
                  }`}
                >
                  {/* CARD TOP HEADER */}
                  <div className="card-top-row">
                    <div className="order-id-block">
                      <span className="order-chip">#{ord.order_id}</span>
                      <button
                        className={`copy-id-btn ${copiedId === ord.order_id ? 'copied' : ''}`}
                        onClick={() => handleCopyOrderId(ord.order_id)}
                        title="Copy Order ID"
                      >
                        {copiedId === ord.order_id ? '✓ Copied' : '📋 Copy'}
                      </button>
                      <span className="order-timestamp">
                        📅 {new Date(ord.order_date).toLocaleDateString()} at{' '}
                        {new Date(ord.order_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="order-status-badge-wrap">
                      <span
                        className={`status-pill-animated status-${ord.status?.toLowerCase()}`}
                      >
                        {isActive && <span className="status-live-dot"></span>}
                        {ord.status === 'DELIVERED' && <span className="status-icon-inline">✓</span>}
                        {ord.status === 'CANCELLED' && <span className="status-icon-inline">✕</span>}
                        {ord.status}
                      </span>
                    </div>
                  </div>

                  {/* FULFILLMENT MINI PROGRESS TRACKER */}
                  {!isCancelled && (
                    <div className="order-mini-tracker">
                      <div className="mini-tracker-track">
                        <div
                          className="mini-tracker-fill"
                          style={{
                            width: `${(progressIdx / (ORDER_STAGES.length - 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="mini-tracker-steps">
                        {ORDER_STAGES.map((st, idx) => {
                          const isDone = idx <= progressIdx;
                          const isCurrent = idx === progressIdx;
                          return (
                            <div
                              key={st.key}
                              className={`mini-step ${isDone ? 'done' : ''} ${
                                isCurrent ? 'current' : ''
                              }`}
                            >
                              <div className="mini-step-dot">{isDone ? '✓' : idx + 1}</div>
                              <span className="mini-step-label">{st.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isCancelled && (
                    <div className="order-cancelled-mini-alert">
                      <div className="cancel-alert-header">
                        <span className="cancel-alert-icon">⚠️</span>
                        <span>Order Cancelled</span>
                      </div>
                      <p>{ord.staff_name || 'This order was cancelled and will not be dispatched for delivery.'}</p>
                    </div>
                  )}

                  {/* CARD BODY: ITEM THUMBNAILS & FINANCIALS */}
                  <div className="card-body-row">
                    <div className="items-preview-box">
                      {itemCount > 0 ? (
                        <>
                          <span className="items-count-badge">
                            {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                          </span>
                          <div className="thumbnails-grid">
                            {items.slice(0, 4).map((it, idx) => (
                              <div
                                key={idx}
                                className="item-thumbnail-card"
                                title={`${it.product_name || it.name} (Qty: ${it.quantity})`}
                              >
                                <img
                                  src={it.image_url || it.image}
                                  alt={it.product_name || it.name}
                                />
                                <span className="item-qty-tag">x{it.quantity}</span>
                              </div>
                            ))}
                            {items.length > 4 && (
                              <div className="more-items-bubble">+{items.length - 4}</div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="order-standard-package-pill">
                          <span className="pkg-emoji">📦</span>
                          <div className="pkg-texts">
                            <strong className="pkg-title">Order Shipment Package</strong>
                            <span className="pkg-sub">Consolidated for direct courier delivery</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="financials-preview-box">
                      <div className="fin-metric">
                        <span className="metric-label">Payment Mode</span>
                        <strong className="payment-chip">{ord.payment_method || 'Cash on Delivery'}</strong>
                      </div>
                      <div className="fin-metric">
                        <span className="metric-label">Grand Total</span>
                        <strong className="total-amount-glow">
                          Rs. {Number(ord.total_amount || ord.total).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* CARD FOOTER: ACTIONS & DESTINATION */}
                  <div className="card-footer-row">
                    <div className="destination-tag">
                      <span className="pin-icon">📍</span>
                      <span>
                        {ord.shipping_address || ord.customer?.address},{' '}
                        {ord.city || ord.customer?.city || 'Sri Lanka'}
                      </span>
                    </div>

                    <div className="card-actions-group">
                      {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(ord.status) && (
                        confirmCancelId === ord.order_id ? (
                          <div className="confirm-cancel-pop">
                            <span className="confirm-label">Confirm Cancel?</span>
                            <button
                              className="confirm-yes-btn"
                              disabled={cancellingId === ord.order_id}
                              onClick={() => handleCancelOrder(ord.order_id)}
                            >
                              {cancellingId === ord.order_id ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                            <button
                              className="confirm-no-btn"
                              onClick={() => setConfirmCancelId(null)}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            className="cancel-order-outline-btn"
                            onClick={() => setConfirmCancelId(ord.order_id)}
                          >
                            🚫 Cancel Order
                          </button>
                        )
                      )}

                      <Link to={`/order/${ord.order_id}`} className="track-order-glow-btn">
                        Live Tracking & Invoice →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="orders-pagination-bar">
                <button
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ← Previous
                </button>

                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      className={`page-num-btn ${currentPage === pg ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pg)}
                    >
                      {pg}
                    </button>
                  ))}
                </div>

                <button
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
