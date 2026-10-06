import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!password || password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // Save user + token to localStorage
      localStorage.setItem("shopSphereUser", JSON.stringify(data.user));
      localStorage.setItem("shopSphereToken", data.token);
      localStorage.setItem("shopSphereLoggedIn", "true");

      // Notify Navbar to update
      window.dispatchEvent(new Event("roleChanged"));

      setMessage("Login successful! Redirecting...");

      setTimeout(() => {
        if (data.user?.role === "ADMINISTRATOR" || data.user?.role === "ADMIN") {
          navigate("/admin?tab=REVIEWS");
        } else {
          navigate("/");
        }
      }, 700);
    } catch (err) {
      setMessage("Cannot connect to server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card login-card">

        <div className="auth-header">

          <p className="auth-label">
            WELCOME BACK
          </p>

          <h1>Login to ShopSphere</h1>

          <p>
            Sign in to continue shopping.
          </p>

        </div>


        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}


        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label>Email Address</label>

            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>


          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password (min. 8 characters)"
              value={password}
              minLength={8}
              onChange={(e) => {
                setPassword(e.target.value);
                if (message && e.target.value.length >= 8) setMessage("");
              }}
              required
            />
            {password.length > 0 && password.length < 8 && (
              <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "4px", fontWeight: 500 }}>
                ⚠️ Password must be at least 8 characters ({password.length}/8)
              </p>
            )}
          </div>


          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login →"}
          </button>

        </form>

        <div style={{ marginTop: '1.25rem', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '0.85rem' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#334155' }}>Demo Admin Login:</p>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@shopsphere.com');
              setPassword('password123');
            }}
            style={{ width: '100%', padding: '7px 12px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>🛡️ Quick Fill Admin</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>admin@shopsphere.com</span>
          </button>
        </div>


        <p className="auth-footer-text">

          Don't have an account?{" "}

          <Link to="/register">
            Create an account
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Login;