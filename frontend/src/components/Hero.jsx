function Hero() {
  return (
    <div
      style={{
        background: "#2563EB",
        color: "white",
        textAlign: "center",
        padding: "80px 20px",
      }}
    >
      <h1>Welcome to Shopping Mall</h1>

      <p>Discover amazing products at the best prices.</p>

      <button
        style={{
          padding: "12px 30px",
          marginTop: "20px",
          background: "white",
          color: "#2563EB",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Shop Now
      </button>
    </div>
  );
}

export default Hero;