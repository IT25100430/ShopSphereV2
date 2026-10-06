import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);

  // Load cart from localStorage and MySQL database backend
  const loadCart = async () => {
    const savedCart =
      JSON.parse(
        localStorage.getItem("shopSphereCart")
      ) || [];

    setCart(savedCart);

    // Sync with database backend
    try {
      const serverCart = await api.getCart();
      if (serverCart && serverCart.cart_items) {
        if (serverCart.cart_items.length > 0) {
          const synced = serverCart.cart_items.map((ci) => ({
            item_id: ci.item_id,
            id: ci.product_id,
            product_id: ci.product_id,
            name: ci.product?.product_name || 'Product',
            category: ci.product?.category_name || 'General',
            price: Number(ci.product?.price || 0),
            image: ci.product?.image_url || '',
            quantity: ci.quantity,
          }));
          setCart(synced);
          localStorage.setItem("shopSphereCart", JSON.stringify(synced));
        } else if (savedCart.length > 0) {
          // Sync local items to server if server cart is currently empty
          for (const item of savedCart) {
            const pId = item.product_id || item.id;
            if (pId) {
              await api.addToCart(pId, item.quantity || 1);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Cart database sync note:", err);
    }
  };

  useEffect(() => {
    loadCart();

    const handleCartUpdate = () => {
      const savedCart =
        JSON.parse(
          localStorage.getItem("shopSphereCart")
        ) || [];
      setCart(savedCart);
    };

    window.addEventListener(
      "cartUpdated",
      handleCartUpdate
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        handleCartUpdate
      );
    };
  }, []);

  // Increase quantity
  const increaseQuantity = async (id) => {
    const targetItem = cart.find((item) => item.product_id === id || item.id === id);
    const updatedCart = cart.map((item) =>
      (item.product_id === id || item.id === id)
        ? {
            ...item,
            quantity: item.quantity + 1,
          }
        : item
    );

    setCart(updatedCart);
    localStorage.setItem("shopSphereCart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));

    try {
      const targetId = targetItem?.item_id || targetItem?.product_id || id;
      await api.updateCartItem(targetId, (targetItem?.quantity || 1) + 1);
    } catch (err) {
      console.warn("Error updating quantity in database:", err);
    }
  };

  // Decrease quantity
  const decreaseQuantity = async (id) => {
    const targetItem = cart.find((item) => item.product_id === id || item.id === id);
    if (!targetItem) return;

    if (targetItem.quantity <= 1) {
      return removeItem(id);
    }

    const updatedCart = cart
      .map((item) =>
        (item.product_id === id || item.id === id)
          ? {
              ...item,
              quantity: item.quantity - 1,
            }
          : item
      )
      .filter((item) => item.quantity > 0);

    setCart(updatedCart);
    localStorage.setItem("shopSphereCart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));

    try {
      const targetId = targetItem?.item_id || targetItem?.product_id || id;
      await api.updateCartItem(targetId, targetItem.quantity - 1);
    } catch (err) {
      console.warn("Error updating quantity in database:", err);
    }
  };

  // Remove product
  const removeItem = async (id) => {
    const targetItem = cart.find((item) => item.product_id === id || item.id === id);
    const updatedCart = cart.filter(
      (item) => item.product_id !== id && item.id !== id
    );

    setCart(updatedCart);
    localStorage.setItem("shopSphereCart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));

    try {
      const targetId = targetItem?.item_id || targetItem?.product_id || id;
      await api.removeCartItem(targetId);
    } catch (err) {
      console.warn("Error removing cart item from database:", err);
    }
  };

  // Total quantity
  const totalItems = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  // Subtotal
  const subtotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  // Delivery charge
  const delivery = cart.length > 0 ? 350 : 0;

  // Final total
  const total = subtotal + delivery;

  // Empty cart
  if (cart.length === 0) {
    return (
      <div className="cart-page">

        <div className="empty-cart">

          <div className="empty-cart-icon">
            🛒
          </div>

          <h1>
            Your Cart is Empty
          </h1>

          <p>
            You haven't added any products yet.
          </p>

          <Link
            to="/products"
            className="continue-shopping"
          >
            Continue Shopping →
          </Link>

        </div>

      </div>
    );
  }

  return (
    <div className="cart-page">

      <div className="cart-container">

        {/* LEFT SIDE */}

        <div className="cart-products">

          <h1>
            Cart Items ({totalItems})
          </h1>

          {cart.map((item) => (

            <div
              className="cart-item"
              key={item.id}
            >

              {/* Product Image */}

              <div className="cart-item-image">

                <img
                  src={item.image}
                  alt={item.name}
                />

              </div>

              {/* Product Details */}

              <div className="cart-item-details">

                <span className="cart-category">
                  {item.category}
                </span>

                <h2>
                  {item.name}
                </h2>

                <p className="cart-price">
                  Rs.{" "}
                  {item.price.toLocaleString()}
                </p>

                {/* Quantity */}

                <div className="quantity-controls">

                  <button
                    onClick={() =>
                      decreaseQuantity(item.id)
                    }
                  >
                    −
                  </button>

                  <span>
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      increaseQuantity(item.id)
                    }
                  >
                    +
                  </button>

                </div>

              </div>

              {/* Remove */}

              <button
                className="remove-button"
                onClick={() =>
                  removeItem(item.id)
                }
              >
                Remove
              </button>

            </div>

          ))}

        </div>


        {/* RIGHT SIDE */}

        <div className="order-summary">

          <h2>
            Order Summary
          </h2>

          <div className="summary-row">

            <span>
              Subtotal
            </span>

            <strong>
              Rs.{" "}
              {subtotal.toLocaleString()}
            </strong>

          </div>

          <div className="summary-row">

            <span>
              Delivery
            </span>

            <strong>
              Rs.{" "}
              {delivery.toLocaleString()}
            </strong>

          </div>

          <hr />

          <div className="summary-total">

            <span>
              Total
            </span>

            <strong>
              Rs.{" "}
              {total.toLocaleString()}
            </strong>

          </div>

          <button
            className="checkout-button"
            onClick={() =>
              navigate("/checkout")
            }
          >
            Proceed to Checkout →
          </button>

        </div>

      </div>

    </div>
  );
}

export default Cart;