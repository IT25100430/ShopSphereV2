import { Link } from "react-router-dom";

function OrderSuccess() {
  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon">✓</div>

        <h1>Order Placed Successfully!</h1>

        <p>
          Thank you for shopping with ShopSphere.
        </p>

        <p>
          Your order has been received and is being processed.
        </p>

        <Link to="/products" className="success-button">
          Continue Shopping →
        </Link>
      </div>
    </div>
  );
}

export default OrderSuccess;