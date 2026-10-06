import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        <div className="footer-brand">

          <h2>
            SHOP<span>SPHERE</span>
          </h2>

          <p>
            Your one-stop online shopping mall where
            you can discover products from multiple
            brands and categories.
          </p>

        </div>


        <div className="footer-column">

          <h3>
            Quick Links
          </h3>

          <Link to="/">
            Home
          </Link>

          <Link to="/products">
            Products
          </Link>

          <Link to="/login">
            Login
          </Link>

          <Link to="/register">
            Register
          </Link>

        </div>


        <div className="footer-column">

          <h3>
            Categories
          </h3>

          <Link to="/products">
            Electronics
          </Link>

          <Link to="/products">
            Fashion
          </Link>

          <Link to="/products">
            Home & Living
          </Link>

          <Link to="/products">
            Beauty
          </Link>

        </div>


        <div className="footer-column">

          <h3>
            Contact Us
          </h3>

          <p>
            📧 support@shopsphere.com
          </p>

          <p>
            📞 +94 11 234 5678
          </p>

          <p>
            📍 Colombo, Sri Lanka
          </p>

        </div>

      </div>


      <div className="footer-bottom">

        <p>
          © 2026 ShopSphere. All rights reserved.
        </p>

        <p>
          Online Shopping Mall
        </p>

      </div>

    </footer>
  );
}

export default Footer;