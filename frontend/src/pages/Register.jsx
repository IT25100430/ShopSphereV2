import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (form.password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: "CUSTOMER",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Save user + token to localStorage
      localStorage.setItem("shopSphereUser", JSON.stringify(data.user));
      localStorage.setItem("shopSphereToken", data.token);

      setMessage("Registration successful!");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setMessage("Cannot connect to server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-header">
          <p className="auth-label">
            JOIN SHOPSPHERE
          </p>

          <h1>Create Your Account</h1>

          <p>
            Register to start shopping with ShopSphere.
          </p>
        </div>

        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-row">

            <div className="form-group">
              <label>First Name</label>

              <input
                type="text"
                name="firstName"
                placeholder="Enter first name"
                value={form.firstName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>

              <input
                type="text"
                name="lastName"
                placeholder="Enter last name"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>

          </div>


          <div className="form-group">
            <label>Email Address</label>

            <input
              type="email"
              name="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>


          <div className="form-group">
            <label>Phone Number</label>

            <input
              type="tel"
              name="phone"
              placeholder="07XXXXXXXX"
              value={form.phone}
              onChange={handleChange}
            />
          </div>


          <div className="form-group">
            <label>Password (min. 8 characters)</label>

            <input
              type="password"
              name="password"
              placeholder="Enter password (at least 8 characters)"
              value={form.password}
              minLength={8}
              onChange={handleChange}
            />
            {form.password.length > 0 && form.password.length < 8 && (
              <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "4px", fontWeight: 500 }}>
                ⚠️ Minimum 8 characters required ({form.password.length}/8)
              </p>
            )}
          </div>


          <div className="form-group">
            <label>Confirm Password</label>

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={form.confirmPassword}
              minLength={8}
              onChange={handleChange}
            />
          </div>


          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account →"}
          </button>

        </form>


        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}

export default Register;