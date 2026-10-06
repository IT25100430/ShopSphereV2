import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/checkout';
import OrderTracking from './pages/OrderTracking';
import MyOrders from './pages/MyOrders';
import ManagementHub from './pages/ManagementHub';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <div className="app-layout">
      {/* Main Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:orderId" element={<OrderTracking />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/admin" element={<ManagementHub />} />
          <Route path="/management" element={<ManagementHub />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Fallback routes */}
          <Route path="/order-success" element={<Navigate to="/my-orders" replace />} />
          <Route path="/order-confirmation" element={<Navigate to="/my-orders" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;