package com.shopsphere.services;

import com.shopsphere.models.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class DataStore {
    private final Map<String, Product> products = new ConcurrentHashMap<>();
    private final Map<String, Category> categories = new ConcurrentHashMap<>();
    private final Map<String, Brand> brands = new ConcurrentHashMap<>();
    private final Map<String, Promotion> promotions = new ConcurrentHashMap<>();
    private final Map<String, Order> orders = new ConcurrentHashMap<>();
    private final Map<String, Review> reviews = new ConcurrentHashMap<>();
    private final Map<String, User> users = new ConcurrentHashMap<>();
    private final Map<String, Cart> carts = new ConcurrentHashMap<>();

    /**
     * Standard public constructor (Singleton pattern removed).
     */
    public DataStore() {
        seedInitialData();
    }

    private void seedInitialData() {
        // Standard User Accounts (password123 for demo authentication)
        users.put("usr-admin-01", new User("usr-admin-01", "Admin Manager", "admin@shopsphere.com", "password123", "+94 77 123 4567", "ADMINISTRATOR"));
        users.put("usr-admin-lk", new User("usr-admin-lk", "Dilshan Perera", "admin@shopsphere.lk", "password123", "+94 77 123 4567", "ADMINISTRATOR"));
        users.put("usr-cust-01", new User("usr-cust-01", "Customer Kasun", "customer@shopsphere.com", "password123", "+94 77 890 1234", "CUSTOMER"));
        users.put("usr-cust-lk", new User("usr-cust-lk", "Kasun Jayasinghe", "kasun@gmail.com", "password123", "+94 77 890 1234", "CUSTOMER"));
        users.put("usr-vend-01", new User("usr-vend-01", "Official Apple Partner", "vendor@shopsphere.com", "password123", "+94 77 555 1234", "VENDOR"));
        users.put("usr-deliv-01", new User("usr-deliv-01", "Courier Sunil", "courier@shopsphere.com", "password123", "+94 71 901 2345", "DELIVERY_STAFF"));
        users.put("usr-deliv-lk", new User("usr-deliv-lk", "Sunil Rathnayake", "delivery@shopsphere.lk", "password123", "+94 71 901 2345", "DELIVERY_STAFF"));

        // Categories
        categories.put("cat-1", new Category("cat-1", "Electronics", "High-tech smart gadgets, audio, and laptops.", "📱"));
        categories.put("cat-2", new Category("cat-2", "Fashion & Apparel", "Footwear, sportswear, and designer clothing.", "👕"));
        categories.put("cat-3", new Category("cat-3", "Home & Living", "Modern furniture, ambient lighting, and appliances.", "🏠"));
        categories.put("cat-4", new Category("cat-4", "Beauty & Personal Care", "Organic skincare sets and wellness essentials.", "💄"));
        categories.put("cat-5", new Category("cat-5", "Sports & Fitness", "Workout gear and sporting goods.", "⚽"));

        // Brands
        brands.put("brd-1", new Brand("brd-1", "Apple", "Premium computing & electronics", "United States"));
        brands.put("brd-2", new Brand("brd-2", "Sony", "Audio & visual entertainment", "Japan"));
        brands.put("brd-3", new Brand("brd-3", "Nike", "Athletic footwear & sportswear", "United States"));
        brands.put("brd-4", new Brand("brd-4", "IKEA", "Minimalist home furniture", "Sweden"));
        brands.put("brd-5", new Brand("brd-5", "Samsung", "Smartphones & displays", "South Korea"));
        brands.put("brd-6", new Brand("brd-6", "Philips", "Home appliances & lighting", "Netherlands"));

        // Products
        products.put("prod-1", new Product("prod-1", "Wireless Noise-Cancelling Headphones", "cat-1", "brd-2", 12999.0, 18, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80", "Premium noise-cancelling headphones with 30-hour battery life.", 4.8));
        products.put("prod-2", new Product("prod-2", "Smart Watch Series 9 GPS", "cat-1", "brd-1", 15999.0, 12, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80", "Smartwatch with ECG, heart-rate tracking, and Retina display.", 4.7));
        products.put("prod-3", new Product("prod-3", "Classic Urban Cotton T-Shirt", "cat-2", "brd-3", 2999.0, 35, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80", "100% breathable organic cotton crewneck tee.", 4.3));
        products.put("prod-4", new Product("prod-4", "Air Flow Running Shoes", "cat-2", "brd-3", 8999.0, 8, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80", "Ultra-lightweight running sneakers with responsive cushioning.", 4.6));
        products.put("prod-5", new Product("prod-5", "Smart Drip Coffee Maker", "cat-3", "brd-6", 11999.0, 3, "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80", "Programmable 12-cup drip coffee maker with permanent filter.", 4.4));
        products.put("prod-6", new Product("prod-6", "Organic Hydrating Skincare Set", "cat-4", "brd-4", 4999.0, 22, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80", "3-step botanical facial cleanser, toner, and serum.", 4.8));
        products.put("prod-7", new Product("prod-7", "Galaxy Pro 5G Smartphone", "cat-1", "brd-5", 89999.0, 6, "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80", "6.7-inch AMOLED 120Hz display with triple 108MP camera.", 4.9));
        products.put("prod-8", new Product("prod-8", "Ultra-Thin Work & Gaming Laptop", "cat-1", "brd-1", 189999.0, 4, "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80", "High-performance laptop with 16GB RAM and 512GB SSD.", 4.7));

        // Promotions
        promotions.put("promo-1", new Promotion("promo-1", "SAVE10", "10% Welcome Discount", "Get 10% off your entire order!", "PERCENTAGE", 10.0, 0.0));
        promotions.put("promo-2", new Promotion("promo-2", "FLAT500", "Flat Rs. 500 Off", "Rs. 500 off on orders over Rs. 5,000", "FIXED_AMOUNT", 500.0, 5000.0));
        promotions.put("promo-3", new Promotion("promo-3", "MALL2026", "Grand Mall Celebration", "15% off orders above Rs. 10,000", "PERCENTAGE", 15.0, 10000.0));

        // Reviews
        reviews.put("rev-1", new Review("rev-1", "prod-1", "Nadeesha K.", 5, "Exceptional noise cancellation and battery life!", "APPROVED", "2026-09-10T10:00:00Z"));
        reviews.put("rev-2", new Review("rev-2", "prod-2", "Chathura M.", 5, "Screen is very bright outdoors. Great tracking.", "APPROVED", "2026-09-11T12:00:00Z"));
        reviews.put("rev-3", new Review("rev-3", "prod-4", "Mahesh P.", 4, "Very comfortable running shoes for morning jogs.", "APPROVED", "2026-09-12T09:00:00Z"));
        reviews.put("rev-4", new Review("rev-4", "prod-5", "Kamal S.", 4, "Brews quickly and looks elegant in the kitchen.", "PENDING", "2026-09-15T07:00:00Z"));

        // Orders
        Order ord1 = new Order();
        ord1.order_id = "ORD-902101";
        ord1.customer_name = "Kasun Jayasinghe";
        ord1.customer_email = "customer@shopsphere.com";
        ord1.customer_phone = "0778901234";
        ord1.shipping_address = "No 45, Galle Road, Colombo 03";
        ord1.city = "Colombo";
        ord1.order_date = "2026-09-14T14:32:00Z";
        ord1.status = "SHIPPED";
        ord1.payment_method = "Credit / Debit Card";
        ord1.payment_status = "COMPLETED";
        ord1.subtotal = 15999.0;
        ord1.discount = 1599.9;
        ord1.promo_code = "SAVE10";
        ord1.total_amount = 14749.1;
        ord1.order_items.add(new OrderItem("prod-2", "Smart Watch Series 9 GPS", 15999.0, 1, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"));
        orders.put(ord1.order_id, ord1);

        // Pre-fill initial cart for customer
        Cart custCart = new Cart("cart-cust-01", "usr-cust-01");
        custCart.cart_items.add(new CartItem("item-1", "prod-1", 1, products.get("prod-1")));
        carts.put("usr-cust-01", custCart);
        carts.put("default_customer", custCart);
    }

    // ==========================================
    // USERS & AUTHENTICATION
    // ==========================================
    public User authenticate(String email, String password) {
        if (email == null) return null;
        for (User u : users.values()) {
            if (u.email != null && u.email.equalsIgnoreCase(email.trim())) {
                if (u.password == null || u.password.equals(password)) {
                    return u;
                }
            }
        }
        return null;
    }

    public User getUserByEmail(String email) {
        if (email == null) return null;
        for (User u : users.values()) {
            if (u.email != null && u.email.equalsIgnoreCase(email.trim())) {
                return u;
            }
        }
        return null;
    }

    public User getUser(String id) {
        return users.get(id);
    }

    public User addUser(User u) {
        if (u.user_id == null || u.user_id.isEmpty()) {
            u.user_id = "usr-" + System.currentTimeMillis();
        }
        users.put(u.user_id, u);
        return u;
    }

    public Collection<User> getAllUsers() {
        return users.values();
    }

    // ==========================================
    // SHOPPING CART
    // ==========================================
    public Cart getCart(String userId) {
        String uid = (userId == null || userId.isEmpty()) ? "default_customer" : userId;
        return carts.computeIfAbsent(uid, id -> new Cart("cart-" + id, id));
    }

    public Cart addToCart(String userId, String productId, int qty) {
        Cart cart = getCart(userId);
        Product p = getProduct(productId);
        if (p == null) return cart;

        boolean found = false;
        for (CartItem item : cart.cart_items) {
            if (item.product_id != null && item.product_id.equals(productId)) {
                item.quantity += qty;
                item.product = p;
                found = true;
                break;
            }
        }
        if (!found) {
            cart.cart_items.add(new CartItem("item-" + System.currentTimeMillis(), productId, qty, p));
        }
        return cart;
    }

    public Cart updateCartItem(String userId, String itemId, int qty) {
        Cart cart = getCart(userId);
        if (qty <= 0) {
            return removeCartItem(userId, itemId);
        }
        for (CartItem item : cart.cart_items) {
            if (item.item_id != null && item.item_id.equals(itemId)) {
                item.quantity = qty;
                break;
            }
        }
        return cart;
    }

    public Cart removeCartItem(String userId, String itemId) {
        Cart cart = getCart(userId);
        cart.cart_items.removeIf(item -> item.item_id != null && item.item_id.equals(itemId));
        return cart;
    }

    public void clearCart(String userId) {
        Cart cart = getCart(userId);
        cart.cart_items.clear();
    }

    // ==========================================
    // PRODUCTS
    // ==========================================
    public Collection<Product> getAllProducts(boolean includeDeleted, boolean includeInactive, String categoryId) {
        List<Product> result = new ArrayList<>();
        for (Product p : products.values()) {
            if (!includeDeleted && p.is_deleted) continue;
            if (!includeInactive && !p.is_active) continue;
            if (categoryId != null && !categoryId.isEmpty() && !"ALL".equalsIgnoreCase(categoryId) && !categoryId.equalsIgnoreCase(p.category_id)) {
                continue;
            }
            result.add(p);
        }
        return result;
    }

    public Collection<Product> getAllProducts(boolean includeDeleted) {
        return getAllProducts(includeDeleted, true, null);
    }

    public Product getProduct(String id) {
        return products.get(id);
    }

    public Product addProduct(Product p) {
        if (p.price < 0) {
            return null;
        }
        if (p.product_id == null || p.product_id.isEmpty()) {
            p.product_id = "prod-" + System.currentTimeMillis();
        }
        p.status = p.stock_qty > 0 ? "ACTIVE" : "OUT_OF_STOCK";
        p.is_active = true;
        p.is_deleted = false;
        products.put(p.product_id, p);
        return p;
    }

    public Product updateProduct(String id, Product p) {
        Product existing = products.get(id);
        if (existing == null) return null;
        if (p.product_name != null) existing.product_name = p.product_name;
        if (p.category_id != null) existing.category_id = p.category_id;
        if (p.brand_id != null) existing.brand_id = p.brand_id;
        if (p.price > 0) existing.price = p.price;
        if (p.stock_qty >= 0) {
            existing.stock_qty = p.stock_qty;
            existing.status = existing.stock_qty > 0 ? "ACTIVE" : "OUT_OF_STOCK";
        }
        if (p.low_stock_threshold >= 0) existing.low_stock_threshold = p.low_stock_threshold;
        if (p.description != null) existing.description = p.description;
        if (p.image_url != null) existing.image_url = p.image_url;
        existing.is_active = p.is_active;
        return existing;
    }

    public Product restoreProduct(String id) {
        Product p = products.get(id);
        if (p != null) {
            p.is_deleted = false;
            p.is_active = true;
            p.status = p.stock_qty > 0 ? "ACTIVE" : "OUT_OF_STOCK";
        }
        return p;
    }

    public boolean deleteProduct(String id) {
        Product existing = products.get(id);
        if (existing != null) {
            existing.is_deleted = true;
            existing.is_active = false;
            return true;
        }
        return false;
    }

    public Product adjustStock(String id, int change) {
        Product p = products.get(id);
        if (p != null) {
            p.stock_qty = Math.max(0, p.stock_qty + change);
            p.status = p.stock_qty > 0 ? "ACTIVE" : "OUT_OF_STOCK";
        }
        return p;
    }

    // ==========================================
    // CATEGORIES
    // ==========================================
    public Collection<Category> getAllCategories() {
        return categories.values();
    }

    public Category getCategory(String id) {
        return categories.get(id);
    }

    public Category addCategory(Category c) {
        if (c.category_id == null || c.category_id.isEmpty()) {
            c.category_id = "cat-" + System.currentTimeMillis();
        }
        categories.put(c.category_id, c);
        return c;
    }

    public Category updateCategory(String id, Category c) {
        Category existing = categories.get(id);
        if (existing == null) return null;
        if (c.category_name != null) existing.category_name = c.category_name;
        if (c.description != null) existing.description = c.description;
        if (c.icon != null) existing.icon = c.icon;
        existing.is_active = c.is_active;
        return existing;
    }

    public Category restoreCategory(String id) {
        Category c = categories.get(id);
        if (c != null) {
            c.is_active = true;
        }
        return c;
    }

    public boolean deleteCategory(String id) {
        Category c = categories.get(id);
        if (c != null) {
            c.is_active = false;
            return true;
        }
        return false;
    }

    // ==========================================
    // BRANDS
    // ==========================================
    public Collection<Brand> getAllBrands() {
        return brands.values();
    }

    public Brand getBrand(String id) {
        return brands.get(id);
    }

    public boolean brandNameExists(String name, String excludeId) {
        if (name == null || name.trim().isEmpty()) return false;
        String trimmed = name.trim();
        return brands.values().stream().anyMatch(b ->
            (excludeId == null || !b.brand_id.equals(excludeId)) &&
            b.brand_name != null && b.brand_name.trim().equalsIgnoreCase(trimmed)
        );
    }

    public Brand addBrand(Brand b) {
        if (b.brand_name != null && brandNameExists(b.brand_name, null)) {
            return null;
        }
        if (b.brand_id == null || b.brand_id.isEmpty()) {
            b.brand_id = "brd-" + System.currentTimeMillis();
        }
        b.brand_name = b.brand_name != null ? b.brand_name.trim() : "";
        brands.put(b.brand_id, b);
        return b;
    }

    public Brand updateBrand(String id, Brand b) {
        Brand existing = brands.get(id);
        if (existing == null) return null;
        if (b.brand_name != null && !b.brand_name.trim().equalsIgnoreCase(existing.brand_name)) {
            if (brandNameExists(b.brand_name, id)) {
                return null;
            }
        }
        if (b.brand_name != null) existing.brand_name = b.brand_name.trim();
        if (b.description != null) existing.description = b.description;
        if (b.origin != null) existing.origin = b.origin;
        existing.is_active = b.is_active;
        return existing;
    }

    public Brand restoreBrand(String id) {
        Brand b = brands.get(id);
        if (b != null) {
            b.is_active = true;
        }
        return b;
    }

    public boolean deleteBrand(String id) {
        Brand b = brands.get(id);
        if (b != null) {
            b.is_active = false;
            return true;
        }
        return false;
    }

    // ==========================================
    // ORDERS
    // ==========================================
    public Collection<Order> getAllOrders() {
        return orders.values();
    }

    public Order getOrder(String id) {
        return orders.get(id);
    }

    public Order addOrder(Order o) {
        if (o.order_id == null || o.order_id.isEmpty()) {
            o.order_id = "SS" + String.valueOf(System.currentTimeMillis()).substring(7);
        }
        if (o.order_date == null || o.order_date.isEmpty()) {
            o.order_date = Instant.now().toString();
        }
        if (o.status == null || o.status.isEmpty()) {
            o.status = "PENDING";
        }
        orders.put(o.order_id, o);

        // Adjust stock for purchased items
        if (o.order_items != null) {
            for (OrderItem item : o.order_items) {
                adjustStock(item.product_id, -item.quantity);
            }
        }
        return o;
    }

    public Order updateOrderStatus(String id, String status, String courier) {
        Order existing = orders.get(id);
        if (existing != null) {
            if (status != null && !status.isEmpty()) {
                existing.status = status;
            }
            if (courier != null && !courier.isEmpty()) {
                existing.staff_name = courier;
            }
        }
        return existing;
    }

    // ==========================================
    // PROMOTIONS
    // ==========================================
    public Collection<Promotion> getAllPromotions() {
        return promotions.values();
    }

    public Promotion getPromotion(String id) {
        return promotions.get(id);
    }

    public Promotion getPromotionByCode(String code) {
        for (Promotion p : promotions.values()) {
            if (p.promotion_code != null && p.promotion_code.equalsIgnoreCase(code.trim())) {
                return p;
            }
        }
        return null;
    }

    public Promotion addPromotion(Promotion p) {
        if (p.promotion_id == null || p.promotion_id.isEmpty()) {
            p.promotion_id = "promo-" + System.currentTimeMillis();
        }
        if (p.status == null || p.status.isEmpty()) {
            p.status = "ACTIVE";
        }
        promotions.put(p.promotion_id, p);
        return p;
    }

    public Promotion updatePromotion(String id, Promotion p) {
        Promotion existing = promotions.get(id);
        if (existing == null) return null;
        if (p.promotion_code != null) existing.promotion_code = p.promotion_code;
        if (p.title != null) existing.title = p.title;
        if (p.description != null) existing.description = p.description;
        if (p.discount_type != null) existing.discount_type = p.discount_type;
        if (p.discount_value > 0) existing.discount_value = p.discount_value;
        if (p.min_spend >= 0) existing.min_spend = p.min_spend;
        if (p.start_date != null) existing.start_date = p.start_date;
        if (p.end_date != null) existing.end_date = p.end_date;
        if (p.status != null) existing.status = p.status;
        return existing;
    }

    public boolean deletePromotion(String id) {
        return promotions.remove(id) != null;
    }

    // ==========================================
    // REVIEWS
    // ==========================================
    public Collection<Review> getAllReviews() {
        return reviews.values();
    }

    public List<Review> getProductReviews(String prodId) {
        List<Review> list = new ArrayList<>();
        for (Review r : reviews.values()) {
            if (r.product_id != null && r.product_id.equals(prodId) && "APPROVED".equals(r.status)) {
                list.add(r);
            }
        }
        return list;
    }

    public Review addReview(Review r) {
        if (r.review_id == null || r.review_id.isEmpty()) {
            r.review_id = "rev-" + System.currentTimeMillis();
        }
        if (r.review_date == null || r.review_date.isEmpty()) {
            r.review_date = Instant.now().toString();
        }
        reviews.put(r.review_id, r);
        return r;
    }

    public Review updateReviewStatus(String id, String status) {
        Review r = reviews.get(id);
        if (r != null) {
            r.status = status;
        }
        return r;
    }

    public boolean deleteReview(String id) {
        return reviews.remove(id) != null;
    }
}
