import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Store } from '../services/store';

function Checkout() {
  const navigate = useNavigate();

  // Load cart
  const [cart, setCart] = useState([]);
  const [availablePromos, setAvailablePromos] = useState([]);

  // Customer information
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Colombo',
    postalCode: '',
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Card information
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: '',
  });

  // Coupon / Promotion state (PBI 13-16)
  const [couponCode, setCouponCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponFeedback, setCouponFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('shopSphereCart')) || [];
    setCart(savedCart);
    api.getPromotions()
      .then((promos) => {
        setAvailablePromos((promos || []).filter((p) => p.status === 'ACTIVE'));
      })
      .catch((err) => {
        console.error('Error loading promos:', err);
        setAvailablePromos(Store.getActivePromotions());
      });

    // Prefill from user session if available
    const savedUser = JSON.parse(localStorage.getItem('shopSphereUser') || '{}');
    if (savedUser.firstName || savedUser.name || savedUser.email) {
      setFormData((prev) => ({
        ...prev,
        firstName: savedUser.firstName || (savedUser.name ? savedUser.name.split(' ')[0] : ''),
        lastName: savedUser.lastName || (savedUser.name ? savedUser.name.split(' ').slice(1).join(' ') : ''),
        email: savedUser.email || '',
        phone: savedUser.phone || '0771234567',
        address: savedUser.shipping_address || 'No 45, Galle Road',
        city: 'Colombo',
        postalCode: '00300',
      }));
    }
  }, []);

  // Financial Calculations
  const subtotal = cart.reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0
  );

  const deliveryFee = cart.length > 0 ? 350 : 0;
  const finalTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  // Apply Coupon Handler with One-Time Use Validation
  const handleApplyCoupon = async (e, directCode = null) => {
    if (e) e.preventDefault();
    const codeToApply = (directCode || couponCode).trim();
    if (!codeToApply) return;

    const emailToUse = (formData.email || '').trim();

    try {
      const validation = await api.validatePromotion(codeToApply, subtotal, emailToUse);
      if (validation.valid) {
        setAppliedPromo(validation.promo);
        setCouponDiscount(Number(validation.discount) || 0);
        setCouponFeedback({ type: 'success', message: `${validation.message} (1-Time Use Applied)` });
      } else {
        setAppliedPromo(null);
        setCouponDiscount(0);
        setCouponFeedback({ type: 'error', message: validation.message });
      }
    } catch (err) {
      // Fallback to local Store validation if backend network/server issue
      try {
        const val = Store.validateCoupon(codeToApply, subtotal, emailToUse);
        if (val.valid) {
          setAppliedPromo(val.promo);
          setCouponDiscount(Number(val.discountAmount) || 0);
          setCouponFeedback({ type: 'success', message: `${val.message} (1-Time Use Applied)` });
        } else {
          setAppliedPromo(null);
          setCouponDiscount(0);
          setCouponFeedback({ type: 'error', message: val.message });
        }
      } catch (fallbackErr) {
        setAppliedPromo(null);
        setCouponDiscount(0);
        setCouponFeedback({ type: 'error', message: err.message || 'Invalid or already used coupon code' });
      }
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedPromo(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponFeedback({ type: '', message: '' });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Your cart is empty.');
      navigate('/products');
      return;
    }

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city
    ) {
      alert('Please fill in all customer and delivery contact details.');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardData.cardNumber || !cardData.cardHolder || !cardData.expiry || !cardData.cvv) {
        alert('Please enter complete debit/credit card details.');
        return;
      }
    }

    const paymentLabel =
      paymentMethod === 'cod'
        ? 'Cash on Delivery'
        : paymentMethod === 'card'
        ? 'Credit / Debit Card'
        : 'Online Bank Transfer';

    try {
      // Create Order via MySQL backend API
      const createdOrder = await api.createOrder({
        customer_id: 'usr-cust-08',
        customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode || '00000',
        payment_method: paymentLabel,
        payment_status: paymentMethod === 'card' ? 'COMPLETED' : 'PENDING',
        subtotal: subtotal,
        discount: couponDiscount,
        promo_code: appliedPromo ? appliedPromo.promotion_code : null,
        delivery_fee: deliveryFee,
        total_amount: finalTotal,
        staff_name: 'Sunil Rathnayake',
        vehicle_no: 'WP-CA-8842',
        order_items: cart.map((c) => ({
          product_id: c.product_id || c.id,
          product_name: c.name,
          price: c.price,
          quantity: c.quantity,
          image_url: c.image,
        })),
      });

      // Save for quick confirmation
      localStorage.setItem('shopSphereLastOrder', JSON.stringify(createdOrder));

      // Track ordered product IDs for review authorization
      const orderedIds = JSON.parse(localStorage.getItem('shopSphereOrderedProductIds') || '[]');
      cart.forEach((c) => {
        const pid = c.product_id || c.id;
        if (pid && !orderedIds.includes(pid)) orderedIds.push(pid);
      });
      localStorage.setItem('shopSphereOrderedProductIds', JSON.stringify(orderedIds));

      // Clear cart locally and in MySQL database
      try {
        await api.clearCart();
      } catch (err) {
        console.warn('Backend cart clear note:', err);
      }
      localStorage.removeItem('shopSphereCart');
      window.dispatchEvent(new Event('cartUpdated'));

      // Navigate to live order tracking
      navigate(`/order/${createdOrder.order_id}`);
    } catch (err) {
      console.error('Failed to create order:', err);
      alert(`Could not place order: ${err.message}`);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Left Side: Forms */}
        <div className="checkout-left">
          <form onSubmit={handlePlaceOrder} id="checkout-form">
            {/* Customer Details */}
            <div className="checkout-card">
              <div className="card-head-title">
                <span className="step-num">1</span>
                <h2>Customer & Delivery Details</h2>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Kasun"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Jayasinghe"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="07XXXXXXXX"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House number, apartment, street name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City / Town *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Colombo, Kandy, Galle"
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="e.g. 00300"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="checkout-card">
              <div className="card-head-title">
                <span className="step-num">2</span>
                <h2>Payment Method</h2>
              </div>

              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected-payment' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <span className="payment-icon">💵</span>
                  <div>
                    <strong>Cash on Delivery (COD)</strong>
                    <p>Pay cash or QR payment when your package arrives at your doorstep.</p>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'card' ? 'selected-payment' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                  />
                  <span className="payment-icon">💳</span>
                  <div>
                    <strong>Credit / Debit Card (Visa / Mastercard)</strong>
                    <p>Encrypted 256-bit instant online payment verification.</p>
                  </div>
                </label>

                {paymentMethod === 'card' && (
                  <div className="card-payment-form">
                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        maxLength="19"
                        value={cardData.cardNumber}
                        onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="Name as printed on card"
                        value={cardData.cardHolder}
                        onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength="5"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV</label>
                        <input
                          type="password"
                          placeholder="123"
                          maxLength="3"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <label className={`payment-option ${paymentMethod === 'online' ? 'selected-payment' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                  />
                  <span className="payment-icon">🏦</span>
                  <div>
                    <strong>Online Banking / Direct Transfer</strong>
                    <p>Transfer directly via Sampath, Commercial, or BOC internet banking.</p>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Right Side: Order Summary & Coupon Code */}
        <div className="checkout-summary">
          <h2>Order Summary</h2>

          {/* Items Preview */}
          <div className="checkout-items-preview">
            {cart.length === 0 ? (
              <p className="empty-cart-text">Your cart is empty.</p>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="checkout-product">
                  <img src={item.image} alt={item.name} />
                  <div className="checkout-product-info">
                    <h4>{item.name}</h4>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <strong>Rs. {(Number(item.price) * Number(item.quantity)).toLocaleString()}</strong>
                </div>
              ))
            )}
          </div>

          <hr />

          {/* Promotion / Coupon Code Box (PBI 13-16) */}
          <div className="coupon-box-wrapper">
            <label className="coupon-label">Have a Promotional Coupon Code?</label>
            <div className="coupon-input-group">
              <input
                type="text"
                placeholder="e.g. SAVE10 or FLAT500"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="coupon-input"
              />
              <button
                type="button"
                className="apply-coupon-btn"
                onClick={handleApplyCoupon}
              >
                Apply
              </button>
            </div>

            {/* Quick Demo Promo Suggestion Chips */}
            <div className="active-promos-hints">
              <span className="hint-title">Try Active Coupons (1-Time Use Policy):</span>
              <div className="hint-chips">
                {availablePromos.slice(0, 4).map((pr) => (
                  <button
                    key={pr.promotion_id}
                    type="button"
                    className="promo-chip"
                    onClick={() => {
                      setCouponCode(pr.promotion_code);
                      handleApplyCoupon(null, pr.promotion_code);
                    }}
                  >
                    🏷️ {pr.promotion_code} ({pr.discount_type === 'PERCENTAGE' ? `${pr.discount_value}%` : `Rs.${pr.discount_value}`} • 1-Time Use)
                  </button>
                ))}
              </div>
            </div>

            {couponFeedback.message && (
              <div className={`coupon-feedback ${couponFeedback.type}`}>
                <span>{couponFeedback.message}</span>
                {appliedPromo && (
                  <button type="button" className="remove-promo-btn" onClick={handleRemoveCoupon}>
                    ✕ Remove
                  </button>
                )}
              </div>
            )}
          </div>

          <hr />

          {/* Calculations Breakdown */}
          <div className="summary-row">
            <span>Subtotal:</span>
            <strong>Rs. {subtotal.toLocaleString()}</strong>
          </div>

          {couponDiscount > 0 && (
            <div className="summary-row text-success">
              <span>Coupon Discount ({appliedPromo?.promotion_code}):</span>
              <strong>− Rs. {couponDiscount.toLocaleString()}</strong>
            </div>
          )}

          <div className="summary-row">
            <span>Standard Islandwide Delivery:</span>
            <strong>Rs. {deliveryFee.toLocaleString()}</strong>
          </div>

          <div className="checkout-total">
            <span>Total Payable:</span>
            <strong>Rs. {finalTotal.toLocaleString()}</strong>
          </div>

          {/* Submit button linked to form */}
          <button
            type="submit"
            form="checkout-form"
            className="place-order-button"
            disabled={cart.length === 0}
          >
            Confirm & Place Order →
          </button>

          <p className="checkout-guarantee">
            🔒 Safe & Secure Checkout • ShopSphere Multi-Vendor Mall Protection
          </p>
        </div>
      </div>
    </div>
  );
}

export default Checkout;