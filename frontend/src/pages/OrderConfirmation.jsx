import { Link } from "react-router-dom";

function OrderConfirmation() {
  const order =
    JSON.parse(localStorage.getItem("lastOrder")) || null;

  if (!order) {
    return (
      <div
        style={{
          minHeight: "70vh",
          background: "#f8f7ff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <h1>No Order Found</h1>

          <p>
            We couldn't find your recent order.
          </p>

          <Link
            to="/products"
            style={buttonStyle}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "75vh",
        background: "#f8f7ff",
        padding: "70px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >

        {/* SUCCESS ICON */}

        <div
          style={{
            width: "90px",
            height: "90px",
            background: "#dcfce7",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 25px",
            fontSize: "45px",
          }}
        >
          ✓
        </div>


        {/* TITLE */}

        <p
          style={{
            color: "#7c3aed",
            fontWeight: "800",
            letterSpacing: "2px",
            fontSize: "14px",
          }}
        >
          ORDER CONFIRMED
        </p>

        <h1
          style={{
            fontSize: "46px",
            color: "#111827",
            margin: "10px 0",
          }}
        >
          Thank You for Your Order!
        </h1>

        <p
          style={{
            color: "#6b7280",
            fontSize: "18px",
          }}
        >
          Your order has been successfully placed.
        </p>


        {/* ORDER CARD */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "30px",
            marginTop: "40px",
            textAlign: "left",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.06)",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom:
                "1px solid #eeeeee",
              paddingBottom: "20px",
            }}
          >

            <div>
              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                }}
              >
                Order ID
              </p>

              <strong
                style={{
                  fontSize: "18px",
                }}
              >
                {order.id}
              </strong>
            </div>


            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                }}
              >
                Order Date
              </p>

              <strong>
                {order.date}
              </strong>
            </div>

          </div>


          {/* CUSTOMER */}

          <div
            style={{
              padding: "25px 0",
              borderBottom:
                "1px solid #eeeeee",
            }}
          >

            <h3>
              Delivery Information
            </h3>

            <p>
              <strong>
                {order.customer.firstName}{" "}
                {order.customer.lastName}
              </strong>
            </p>

            <p
              style={{
                color: "#6b7280",
              }}
            >
              {order.customer.address}
              <br />
              {order.customer.city},{" "}
              {order.customer.postalCode}
              <br />
              {order.customer.phone}
              <br />
              {order.customer.email}
            </p>

          </div>


          {/* PAYMENT */}

          <div
            style={{
              padding: "25px 0",
              borderBottom:
                "1px solid #eeeeee",
            }}
          >

            <h3>
              Payment Method
            </h3>

            <p>
              {order.paymentMethod}
            </p>

          </div>


          {/* TOTAL */}

          <div
            style={{
              paddingTop: "25px",
            }}
          >

            <div style={summaryRow}>
              <span>Subtotal</span>

              <strong>
                Rs.{" "}
                {order.subtotal.toLocaleString()}
              </strong>
            </div>


            <div style={summaryRow}>
              <span>Delivery</span>

              <strong>
                Rs.{" "}
                {order.delivery.toLocaleString()}
              </strong>
            </div>


            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                marginTop: "20px",
                paddingTop: "20px",
                borderTop:
                  "1px solid #eeeeee",
                fontSize: "22px",
              }}
            >

              <strong>Total</strong>

              <strong
                style={{
                  color: "#7c3aed",
                }}
              >
                Rs.{" "}
                {order.total.toLocaleString()}
              </strong>

            </div>

          </div>

        </div>


        {/* BUTTONS */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            marginTop: "30px",
          }}
        >

          <Link
            to="/products"
            style={buttonStyle}
          >
            Continue Shopping
          </Link>

          <Link
            to="/"
            style={{
              ...buttonStyle,
              background: "#ffffff",
              color: "#7c3aed",
              border:
                "1px solid #7c3aed",
            }}
          >
            Back to Home
          </Link>

        </div>

      </div>
    </div>
  );
}


const summaryRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "15px",
  color: "#4b5563",
};


const buttonStyle = {
  display: "inline-block",
  padding: "14px 25px",
  background: "#7c3aed",
  color: "#ffffff",
  borderRadius: "9px",
  textDecoration: "none",
  fontWeight: "700",
};


export default OrderConfirmation;