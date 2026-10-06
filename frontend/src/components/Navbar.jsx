import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem('shopSphereLoggedIn') === 'true'
  );

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('shopSphereUser')) || null
  );

  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('shopSphereCart')) || [];
    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    setCartCount(totalQuantity);
  };

  useEffect(() => {
    updateCartCount();

    const handleCartUpdate = () => updateCartCount();
    const handleRoleUpdate = () => {
      setUser(JSON.parse(localStorage.getItem('shopSphereUser')) || null);
      setLoggedIn(localStorage.getItem('shopSphereLoggedIn') === 'true');
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);
    window.addEventListener('roleChanged', handleRoleUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
      window.removeEventListener('roleChanged', handleRoleUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('shopSphereLoggedIn');
    localStorage.removeItem('shopSphereUser');
    localStorage.removeItem('shopSphereToken');
    setLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  const isAdmin = Boolean(
    loggedIn && user &&
    (user.role === 'ADMINISTRATOR' ||
     user.role === 'ADMIN' ||
     user.role === 'STORE_MANAGER' ||
     user.role === 'MANAGER')
  );

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* LOGO */}
        <Link to="/" className="navbar-logo">
          SHOP<span>SPHERE</span>
        </Link>

        {/* NAVIGATION */}
        <nav className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/my-orders">My Orders</Link>
          {isAdmin && (
            <Link to="/management" className="mgmt-nav-link" title="Store Management Portal">
              ⚙️ Admin Portal <span className="nav-pulse-badge">ADMIN</span>
            </Link>
          )}
        </nav>

        {/* RIGHT SIDE */}
        <div className="navbar-actions">
          {/* SEARCH */}
          <button
            className="navbar-icon"
            onClick={() => navigate('/products')}
            title="Search Products"
          >
            🔍
          </button>

          {/* LOGIN / USER */}
          {loggedIn && user ? (
            <div className="user-section">
              <div className="user-profile-badge">
                <span className="user-avatar-circle">
                  {(user.firstName || user.name || 'U').charAt(0).toUpperCase()}
                </span>
                <span className="welcome-user">
                  {(user.firstName || user.name || 'User').split(' ')[0]}
                </span>
                {isAdmin && <span className="admin-badge-chip">ADMIN</span>}
              </div>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-button">
              Login
            </Link>
          )}

          {/* CART */}
          <Link to="/cart" className="cart-button" title="Shopping Cart">
            🛒
            <span className="cart-badge">{cartCount}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;