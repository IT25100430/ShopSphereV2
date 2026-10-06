package com.shopsphere.services;

import com.shopsphere.models.*;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import java.util.logging.Logger;

/**
 * DatabaseStore — MySQL-backed replacement for DataStore.
 * Exposes the exact same public API so all handlers work without changes.
 */
public class DatabaseStore {

    private static final Logger log = Logger.getLogger(DatabaseStore.class.getName());
    private final DatabaseManager databaseManager;

    /**
     * Standard public constructor using dependency injection (Singleton pattern removed).
     */
    public DatabaseStore(DatabaseManager databaseManager) {
        this.databaseManager = (databaseManager != null) ? databaseManager : new DatabaseManager();
    }

    public DatabaseStore() {
        this(new DatabaseManager());
    }

    private DatabaseManager db() {
        return this.databaseManager;
    }

    // ==========================================
    // USERS & AUTHENTICATION
    // ==========================================

    public User authenticate(String email, String password) {
        if (email == null) return null;
        String sql = "SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND password = ?";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim());
            ps.setString(2, password);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapUser(rs);
        } catch (SQLException e) {
            log.severe("authenticate: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return null;
    }

    public User getUserByEmail(String email) {
        if (email == null) return null;
        String sql = "SELECT * FROM users WHERE LOWER(email) = LOWER(?)";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim());
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapUser(rs);
        } catch (SQLException e) {
            log.severe("getUserByEmail: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return null;
    }

    public User getUser(String id) {
        String sql = "SELECT * FROM users WHERE user_id = ?";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapUser(rs);
        } catch (SQLException e) {
            log.severe("getUser: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return null;
    }

    public User addUser(User u) {
        if (u.user_id == null || u.user_id.isEmpty()) {
            u.user_id = "usr-" + System.currentTimeMillis();
        }
        String sql = "INSERT INTO users (user_id, name, email, password, phone, role, shipping_address) VALUES (?,?,?,?,?,?,?)";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, u.user_id);
            ps.setString(2, u.name);
            ps.setString(3, u.email);
            ps.setString(4, u.password);
            ps.setString(5, u.phone);
            ps.setString(6, u.role != null ? u.role : "CUSTOMER");
            ps.setString(7, u.shipping_address);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("addUser: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return u;
    }

    public Collection<User> getAllUsers() {
        List<User> list = new ArrayList<>();
        String sql = "SELECT * FROM users";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapUser(rs));
        } catch (SQLException e) {
            log.severe("getAllUsers: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return list;
    }

    private User mapUser(ResultSet rs) throws SQLException {
        User u = new User();
        u.user_id          = rs.getString("user_id");
        u.name             = rs.getString("name");
        u.email            = rs.getString("email");
        u.password         = rs.getString("password");
        u.phone            = rs.getString("phone");
        u.role             = rs.getString("role");
        u.shipping_address = rs.getString("shipping_address");
        return u;
    }

    // ==========================================
    // SHOPPING CART
    // ==========================================

    public Cart getCart(String userId) {
        String uid = (userId == null || userId.isEmpty()) ? "default_customer" : userId;
        Connection conn = db().getConnection();
        try {
            // Find existing cart_id or insert new cart
            String cartId = null;
            String findSql = "SELECT cart_id FROM carts WHERE user_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(findSql)) {
                ps.setString(1, uid);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    cartId = rs.getString("cart_id");
                }
            }
            if (cartId == null) {
                cartId = "cart-" + uid;
                String upsert = "INSERT INTO carts (cart_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)";
                try (PreparedStatement ps = conn.prepareStatement(upsert)) {
                    ps.setString(1, cartId);
                    ps.setString(2, uid);
                    ps.executeUpdate();
                }
                // Verify/reload cartId in case existing row with different cart_id
                try (PreparedStatement ps = conn.prepareStatement(findSql)) {
                    ps.setString(1, uid);
                    ResultSet rs = ps.executeQuery();
                    if (rs.next()) {
                        cartId = rs.getString("cart_id");
                    }
                }
            }

            // Build Cart object with items
            Cart cart = new Cart(cartId != null ? cartId : "cart-" + uid, uid);
            String sql = "SELECT ci.item_id, ci.product_id, ci.quantity FROM cart_items ci WHERE ci.cart_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, cart.cart_id);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    String itemId   = rs.getString("item_id");
                    String prodId   = rs.getString("product_id");
                    int    qty      = rs.getInt("quantity");
                    Product product = getProductInternal(conn, prodId);
                    cart.cart_items.add(new CartItem(itemId, prodId, qty, product));
                }
            }
            return cart;
        } catch (SQLException e) {
            log.severe("getCart: " + e.getMessage());
            return new Cart("cart-" + uid, uid);
        } finally {
            db().releaseConnection(conn);
        }
    }

    public Cart addToCart(String userId, String productId, int qty) {
        String uid = (userId == null || userId.isEmpty()) ? "default_customer" : userId;
        Cart cart = getCart(uid);
        String cartId = cart.cart_id;
        if (cartId == null || cartId.isEmpty()) {
            cartId = "cart-" + uid;
        }

        Connection conn = db().getConnection();
        try {
            // Check if item already exists in this cart
            String check = "SELECT item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(check)) {
                ps.setString(1, cartId);
                ps.setString(2, productId);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    String existingItemId = rs.getString("item_id");
                    int newQty = rs.getInt("quantity") + qty;
                    String update = "UPDATE cart_items SET quantity = ? WHERE item_id = ?";
                    try (PreparedStatement up = conn.prepareStatement(update)) {
                        up.setInt(1, newQty);
                        up.setString(2, existingItemId);
                        up.executeUpdate();
                    }
                } else {
                    String insert = "INSERT INTO cart_items (item_id, cart_id, product_id, quantity) VALUES (?,?,?,?)";
                    try (PreparedStatement ins = conn.prepareStatement(insert)) {
                        ins.setString(1, "item-" + System.currentTimeMillis());
                        ins.setString(2, cartId);
                        ins.setString(3, productId);
                        ins.setInt(4, qty);
                        ins.executeUpdate();
                    }
                }
            }
        } catch (SQLException e) {
            log.severe("addToCart: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return getCart(uid);
    }

    public Cart updateCartItem(String userId, String itemIdOrProdId, int qty) {
        if (qty <= 0) return removeCartItem(userId, itemIdOrProdId);
        String uid = (userId == null || userId.isEmpty()) ? "default_customer" : userId;
        Cart cart = getCart(uid);
        String cartId = cart.cart_id;

        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(
                "UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND (item_id = ? OR product_id = ?)")) {
            ps.setInt(1, qty);
            ps.setString(2, cartId);
            ps.setString(3, itemIdOrProdId);
            ps.setString(4, itemIdOrProdId);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("updateCartItem: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return getCart(uid);
    }

    public Cart removeCartItem(String userId, String itemIdOrProdId) {
        String uid = (userId == null || userId.isEmpty()) ? "default_customer" : userId;
        Cart cart = getCart(uid);
        String cartId = cart.cart_id;

        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(
                "DELETE FROM cart_items WHERE cart_id = ? AND (item_id = ? OR product_id = ?)")) {
            ps.setString(1, cartId);
            ps.setString(2, itemIdOrProdId);
            ps.setString(3, itemIdOrProdId);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("removeCartItem: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return getCart(uid);
    }

    public void clearCart(String userId) {
        String uid = (userId == null || userId.isEmpty()) ? "default_customer" : userId;
        Cart cart = getCart(uid);
        String cartId = cart.cart_id;

        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("DELETE FROM cart_items WHERE cart_id = ?")) {
            ps.setString(1, cartId);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("clearCart: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
    }

    // ==========================================
    // PRODUCTS
    // ==========================================

    public Collection<Product> getAllProducts(boolean includeDeleted, boolean includeInactive, String categoryId) {
        List<Product> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT * FROM products WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (categoryId != null && !categoryId.isEmpty() && !"ALL".equalsIgnoreCase(categoryId)) {
            sql.append(" AND category_id = ?");
            params.add(categoryId);
        }
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapProduct(rs));
        } catch (SQLException e) {
            log.severe("getAllProducts: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return list;
    }

    public Collection<Product> getAllProducts(boolean includeDeleted) {
        return getAllProducts(includeDeleted, true, null);
    }

    public Product getProduct(String id) {
        Connection conn = db().getConnection();
        try {
            return getProductInternal(conn, id);
        } finally {
            db().releaseConnection(conn);
        }
    }

    private Product getProductInternal(Connection conn, String id) {
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM products WHERE product_id = ?")) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapProduct(rs);
        } catch (SQLException e) {
            log.severe("getProduct: " + e.getMessage());
        }
        return null;
    }

    public Product addProduct(Product p) {
        if (p.price < 0) {
            log.warning("addProduct: Price cannot be negative (" + p.price + ")");
            return null;
        }
        if (p.product_id == null || p.product_id.isEmpty()) {
            p.product_id = "prod-" + System.currentTimeMillis();
        }
        p.status    = p.stock_qty > 0 ? "ACTIVE" : "OUT_OF_STOCK";
        p.is_active = true;
        p.is_deleted = false;
        if (p.rating_stars == null || p.rating_stars.isEmpty()) {
            p.rating_stars = Product.formatStars(p.rating);
        }
        String sql = "INSERT INTO products (product_id, product_name, category_id, brand_id, price, stock_qty, low_stock_threshold, status, is_active, is_deleted, image_url, description, rating, rating_stars) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1,  p.product_id);
            ps.setString(2,  p.product_name);
            ps.setString(3,  p.category_id);
            ps.setString(4,  p.brand_id);
            ps.setDouble(5,  p.price);
            ps.setInt(6,     p.stock_qty);
            ps.setInt(7,     p.low_stock_threshold);
            ps.setString(8,  p.status);
            ps.setBoolean(9, p.is_active);
            ps.setBoolean(10,p.is_deleted);
            ps.setString(11, p.image_url);
            ps.setString(12, p.description);
            ps.setDouble(13, p.rating);
            ps.setString(14, p.rating_stars);
            ps.executeUpdate();
        } catch (SQLException e) {
            // Fallback for schema without rating_stars
            String fallbackSql = "INSERT INTO products (product_id, product_name, category_id, brand_id, price, stock_qty, low_stock_threshold, status, is_active, is_deleted, image_url, description, rating) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
            try (PreparedStatement ps2 = conn.prepareStatement(fallbackSql)) {
                ps2.setString(1,  p.product_id);
                ps2.setString(2,  p.product_name);
                ps2.setString(3,  p.category_id);
                ps2.setString(4,  p.brand_id);
                ps2.setDouble(5,  p.price);
                ps2.setInt(6,     p.stock_qty);
                ps2.setInt(7,     p.low_stock_threshold);
                ps2.setString(8,  p.status);
                ps2.setBoolean(9, p.is_active);
                ps2.setBoolean(10,p.is_deleted);
                ps2.setString(11, p.image_url);
                ps2.setString(12, p.description);
                ps2.setDouble(13, p.rating);
                ps2.executeUpdate();
            } catch (SQLException ex) {
                log.severe("addProduct: " + ex.getMessage());
            }
        } finally {
            db().releaseConnection(conn);
        }
        return p;
    }

    public Product updateProduct(String id, Product p) {
        Product existing = getProduct(id);
        if (existing == null) return null;
        if (p.product_name != null)          existing.product_name       = p.product_name;
        if (p.category_id != null)           existing.category_id        = p.category_id;
        if (p.brand_id != null)              existing.brand_id           = p.brand_id;
        if (p.price > 0)                     existing.price              = p.price;
        if (p.stock_qty >= 0) {
            existing.stock_qty = p.stock_qty;
            existing.status    = existing.stock_qty > 0 ? "ACTIVE" : "OUT_OF_STOCK";
        }
        if (p.low_stock_threshold >= 0)      existing.low_stock_threshold = p.low_stock_threshold;
        if (p.description != null)           existing.description        = p.description;
        if (p.image_url != null)             existing.image_url          = p.image_url;
        if (p.rating > 0)                    existing.rating             = p.rating;
        existing.rating_stars = Product.formatStars(existing.rating);
        existing.is_active = p.is_active;

        String sql = "UPDATE products SET product_name=?, category_id=?, brand_id=?, price=?, stock_qty=?, low_stock_threshold=?, status=?, is_active=?, image_url=?, description=?, rating=?, rating_stars=? WHERE product_id=?";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1,  existing.product_name);
            ps.setString(2,  existing.category_id);
            ps.setString(3,  existing.brand_id);
            ps.setDouble(4,  existing.price);
            ps.setInt(5,     existing.stock_qty);
            ps.setInt(6,     existing.low_stock_threshold);
            ps.setString(7,  existing.status);
            ps.setBoolean(8, existing.is_active);
            ps.setString(9,  existing.image_url);
            ps.setString(10, existing.description);
            ps.setDouble(11, existing.rating);
            ps.setString(12, existing.rating_stars);
            ps.setString(13, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            String fallbackSql = "UPDATE products SET product_name=?, category_id=?, brand_id=?, price=?, stock_qty=?, low_stock_threshold=?, status=?, is_active=?, image_url=?, description=?, rating=? WHERE product_id=?";
            try (PreparedStatement ps2 = conn.prepareStatement(fallbackSql)) {
                ps2.setString(1,  existing.product_name);
                ps2.setString(2,  existing.category_id);
                ps2.setString(3,  existing.brand_id);
                ps2.setDouble(4,  existing.price);
                ps2.setInt(5,     existing.stock_qty);
                ps2.setInt(6,     existing.low_stock_threshold);
                ps2.setString(7,  existing.status);
                ps2.setBoolean(8, existing.is_active);
                ps2.setString(9,  existing.image_url);
                ps2.setString(10, existing.description);
                ps2.setDouble(11, existing.rating);
                ps2.setString(12, id);
                ps2.executeUpdate();
            } catch (SQLException ex) {
                log.severe("updateProduct: " + ex.getMessage());
            }
        } finally {
            db().releaseConnection(conn);
        }
        return existing;
    }

    public Product restoreProduct(String id) {
        String sql = "UPDATE products SET is_deleted=FALSE, is_active=TRUE, status=CASE WHEN stock_qty>0 THEN 'ACTIVE' ELSE 'OUT_OF_STOCK' END WHERE product_id=?";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("restoreProduct: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return getProduct(id);
    }

    public boolean deleteProduct(String id) {
        Connection conn = db().getConnection();
        try {
            // Clean up related cart items and reviews
            try (PreparedStatement psCart = conn.prepareStatement("DELETE FROM cart_items WHERE product_id=?")) {
                psCart.setString(1, id);
                psCart.executeUpdate();
            }
            try (PreparedStatement psRev = conn.prepareStatement("DELETE FROM reviews WHERE product_id=?")) {
                psRev.setString(1, id);
                psRev.executeUpdate();
            }
            // Permanently delete product row from database
            String sql = "DELETE FROM products WHERE product_id=?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, id);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            log.severe("deleteProduct: " + e.getMessage());
            return false;
        } finally {
            db().releaseConnection(conn);
        }
    }

    public Product adjustStock(String id, int change) {
        String sql = "UPDATE products SET stock_qty = GREATEST(0, stock_qty + ?), status = CASE WHEN GREATEST(0, stock_qty + ?) > 0 THEN 'ACTIVE' ELSE 'OUT_OF_STOCK' END WHERE product_id = ?";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, change);
            ps.setInt(2, change);
            ps.setString(3, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("adjustStock: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return getProduct(id);
    }

    private Product mapProduct(ResultSet rs) throws SQLException {
        Product p = new Product();
        p.product_id          = rs.getString("product_id");
        p.product_name        = rs.getString("product_name");
        p.category_id         = rs.getString("category_id");
        p.brand_id            = rs.getString("brand_id");
        p.price               = rs.getDouble("price");
        p.stock_qty           = rs.getInt("stock_qty");
        p.low_stock_threshold = rs.getInt("low_stock_threshold");
        p.status              = rs.getString("status");
        p.is_active           = rs.getBoolean("is_active");
        p.is_deleted          = rs.getBoolean("is_deleted");
        p.image_url           = rs.getString("image_url");
        p.description         = rs.getString("description");
        p.rating              = rs.getDouble("rating");
        try {
            String stars = rs.getString("rating_stars");
            p.rating_stars = (stars != null && !stars.isEmpty()) ? stars : Product.formatStars(p.rating);
        } catch (SQLException ignored) {
            p.rating_stars = Product.formatStars(p.rating);
        }
        return p;
    }

    // ==========================================
    // CATEGORIES
    // ==========================================

    public Collection<Category> getAllCategories() {
        List<Category> list = new ArrayList<>();
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM categories WHERE is_active=TRUE")) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapCategory(rs));
        } catch (SQLException e) {
            log.severe("getAllCategories: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return list;
    }

    public Category getCategory(String id) {
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM categories WHERE category_id = ?")) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapCategory(rs);
        } catch (SQLException e) {
            log.severe("getCategory: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return null;
    }

    public Category addCategory(Category c) {
        if (c.category_id == null || c.category_id.isEmpty()) {
            c.category_id = "cat-" + System.currentTimeMillis();
        }
        String sql = "INSERT INTO categories (category_id, category_name, description, icon, is_active) VALUES (?,?,?,?,?)";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, c.category_id);
            ps.setString(2, c.category_name);
            ps.setString(3, c.description);
            ps.setString(4, c.icon);
            ps.setBoolean(5, c.is_active);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("addCategory: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return c;
    }

    public Category updateCategory(String id, Category c) {
        Category existing = getCategory(id);
        if (existing == null) return null;
        if (c.category_name != null) existing.category_name = c.category_name;
        if (c.description != null)   existing.description   = c.description;
        if (c.icon != null)          existing.icon          = c.icon;
        existing.is_active = c.is_active;
        String sql = "UPDATE categories SET category_name=?, description=?, icon=?, is_active=? WHERE category_id=?";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1,  existing.category_name);
            ps.setString(2,  existing.description);
            ps.setString(3,  existing.icon);
            ps.setBoolean(4, existing.is_active);
            ps.setString(5,  id);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("updateCategory: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return existing;
    }

    public Category restoreCategory(String id) {
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("UPDATE categories SET is_active=TRUE WHERE category_id=?")) {
            ps.setString(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("restoreCategory: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return getCategory(id);
    }

    public boolean deleteCategory(String id) {
        Connection conn = db().getConnection();
        try {
            try (PreparedStatement psProd = conn.prepareStatement("UPDATE products SET category_id=NULL WHERE category_id=?")) {
                psProd.setString(1, id);
                psProd.executeUpdate();
            }
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM categories WHERE category_id=?")) {
                ps.setString(1, id);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            log.severe("deleteCategory: " + e.getMessage());
            return false;
        } finally {
            db().releaseConnection(conn);
        }
    }

    private Category mapCategory(ResultSet rs) throws SQLException {
        Category c = new Category();
        c.category_id   = rs.getString("category_id");
        c.category_name = rs.getString("category_name");
        c.description   = rs.getString("description");
        c.icon          = rs.getString("icon");
        c.is_active     = rs.getBoolean("is_active");
        return c;
    }

    // ==========================================
    // BRANDS
    // ==========================================

    public Collection<Brand> getAllBrands() {
        List<Brand> list = new ArrayList<>();
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM brands WHERE is_active=TRUE")) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapBrand(rs));
        } catch (SQLException e) {
            log.severe("getAllBrands: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return list;
    }

    public Brand getBrand(String id) {
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM brands WHERE brand_id = ?")) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapBrand(rs);
        } catch (SQLException e) {
            log.severe("getBrand: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return null;
    }

    public boolean brandNameExists(String name, String excludeId) {
        if (name == null || name.trim().isEmpty()) return false;
        String sql = (excludeId != null && !excludeId.trim().isEmpty())
            ? "SELECT brand_id FROM brands WHERE LOWER(TRIM(brand_name)) = LOWER(TRIM(?)) AND brand_id <> ?"
            : "SELECT brand_id FROM brands WHERE LOWER(TRIM(brand_name)) = LOWER(TRIM(?))";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, name.trim());
            if (excludeId != null && !excludeId.trim().isEmpty()) {
                ps.setString(2, excludeId.trim());
            }
            ResultSet rs = ps.executeQuery();
            return rs.next();
        } catch (SQLException e) {
            log.severe("brandNameExists: " + e.getMessage());
            return false;
        } finally {
            db().releaseConnection(conn);
        }
    }

    public Brand addBrand(Brand b) {
        if (b.brand_name != null && brandNameExists(b.brand_name, null)) {
            log.warning("addBrand: Brand with name '" + b.brand_name + "' already exists.");
            return null;
        }
        if (b.brand_id == null || b.brand_id.isEmpty()) {
            b.brand_id = "brd-" + System.currentTimeMillis();
        }
        String sql = "INSERT INTO brands (brand_id, brand_name, description, origin, is_active) VALUES (?,?,?,?,?)";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, b.brand_id);
            ps.setString(2, b.brand_name != null ? b.brand_name.trim() : "");
            ps.setString(3, b.description);
            ps.setString(4, b.origin);
            ps.setBoolean(5, b.is_active);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("addBrand: " + e.getMessage());
            return null;
        } finally {
            db().releaseConnection(conn);
        }
        return b;
    }

    public Brand updateBrand(String id, Brand b) {
        Brand existing = getBrand(id);
        if (existing == null) return null;
        if (b.brand_name != null && !b.brand_name.trim().equalsIgnoreCase(existing.brand_name)) {
            if (brandNameExists(b.brand_name, id)) {
                log.warning("updateBrand: Brand with name '" + b.brand_name + "' already exists.");
                return null;
            }
        }
        if (b.brand_name != null)  existing.brand_name  = b.brand_name.trim();
        if (b.description != null) existing.description = b.description;
        if (b.origin != null)      existing.origin      = b.origin;
        existing.is_active = b.is_active;
        String sql = "UPDATE brands SET brand_name=?, description=?, origin=?, is_active=? WHERE brand_id=?";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1,  existing.brand_name);
            ps.setString(2,  existing.description);
            ps.setString(3,  existing.origin);
            ps.setBoolean(4, existing.is_active);
            ps.setString(5,  id);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("updateBrand: " + e.getMessage());
            return null;
        } finally {
            db().releaseConnection(conn);
        }
        return existing;
    }

    public Brand restoreBrand(String id) {
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("UPDATE brands SET is_active=TRUE WHERE brand_id=?")) {
            ps.setString(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("restoreBrand: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return getBrand(id);
    }

    public boolean deleteBrand(String id) {
        Connection conn = db().getConnection();
        try {
            try (PreparedStatement psProd = conn.prepareStatement("UPDATE products SET brand_id=NULL WHERE brand_id=?")) {
                psProd.setString(1, id);
                psProd.executeUpdate();
            }
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM brands WHERE brand_id=?")) {
                ps.setString(1, id);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            log.severe("deleteBrand: " + e.getMessage());
            return false;
        } finally {
            db().releaseConnection(conn);
        }
    }

    private Brand mapBrand(ResultSet rs) throws SQLException {
        Brand b = new Brand();
        b.brand_id    = rs.getString("brand_id");
        b.brand_name  = rs.getString("brand_name");
        b.description = rs.getString("description");
        b.origin      = rs.getString("origin");
        b.is_active   = rs.getBoolean("is_active");
        return b;
    }

    // ==========================================
    // ORDERS
    // ==========================================

    public Collection<Order> getAllOrders() {
        List<Order> list = new ArrayList<>();
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM orders ORDER BY created_at DESC")) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Order o = mapOrder(rs);
                o.order_items = getOrderItems(conn, o.order_id);
                list.add(o);
            }
        } catch (SQLException e) {
            log.severe("getAllOrders: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return list;
    }

    public Order getOrder(String id) {
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM orders WHERE order_id = ?")) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                Order o = mapOrder(rs);
                o.order_items = getOrderItems(conn, id);
                return o;
            }
        } catch (SQLException e) {
            log.severe("getOrder: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return null;
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
        String sql = "INSERT INTO orders (order_id, customer_id, customer_name, customer_email, customer_phone, shipping_address, city, postal_code, order_date, status, payment_method, payment_status, subtotal, discount, promo_code, delivery_fee, total_amount, staff_name, vehicle_no) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        Connection conn = db().getConnection();
        try {
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1,  o.order_id);
                ps.setString(2,  o.customer_id);
                ps.setString(3,  o.customer_name);
                ps.setString(4,  o.customer_email);
                ps.setString(5,  o.customer_phone);
                ps.setString(6,  o.shipping_address);
                ps.setString(7,  o.city);
                ps.setString(8,  o.postal_code);
                ps.setString(9,  o.order_date);
                ps.setString(10, o.status);
                ps.setString(11, o.payment_method);
                ps.setString(12, o.payment_status);
                ps.setDouble(13, o.subtotal);
                ps.setDouble(14, o.discount);
                ps.setString(15, o.promo_code);
                ps.setDouble(16, o.delivery_fee);
                ps.setDouble(17, o.total_amount);
                ps.setString(18, o.staff_name);
                ps.setString(19, o.vehicle_no);
                ps.executeUpdate();
            }
            // Insert order items
            if (o.order_items != null) {
                String itemSql = "INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image_url) VALUES (?,?,?,?,?,?)";
                for (OrderItem item : o.order_items) {
                    try (PreparedStatement ps = conn.prepareStatement(itemSql)) {
                        ps.setString(1, o.order_id);
                        ps.setString(2, item.product_id);
                        ps.setString(3, item.product_name);
                        ps.setDouble(4, item.price);
                        ps.setInt(5,    item.quantity);
                        ps.setString(6, item.image_url);
                        ps.executeUpdate();
                    }
                    // Stock decrement and audit log are automatically handled by database trigger: trg_order_items_after_insert
                }
            }
        } catch (SQLException e) {
            log.severe("addOrder: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return o;
    }

    public Order updateOrderStatus(String id, String status, String courier) {
        // Stock restoration on CANCELLED is automatically handled by database trigger: trg_orders_after_update_status
        String sql = "UPDATE orders SET status=COALESCE(?,status), staff_name=COALESCE(?,staff_name) WHERE order_id=?";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, (status  != null && !status.isEmpty())  ? status  : null);
            ps.setString(2, (courier != null && !courier.isEmpty()) ? courier : null);
            ps.setString(3, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("updateOrderStatus: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return getOrder(id);
    }

    public boolean deleteOrder(String id) {
        Connection conn = db().getConnection();
        try {
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM order_items WHERE order_id=?")) {
                ps.setString(1, id);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM orders WHERE order_id=?")) {
                ps.setString(1, id);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            log.severe("deleteOrder: " + e.getMessage());
            return false;
        } finally {
            db().releaseConnection(conn);
        }
    }

    private List<OrderItem> getOrderItems(Connection conn, String orderId) throws SQLException {
        List<OrderItem> items = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM order_items WHERE order_id = ?")) {
            ps.setString(1, orderId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                items.add(new OrderItem(
                    rs.getString("product_id"),
                    rs.getString("product_name"),
                    rs.getDouble("price"),
                    rs.getInt("quantity"),
                    rs.getString("image_url")
                ));
            }
        }
        return items;
    }

    private Order mapOrder(ResultSet rs) throws SQLException {
        Order o = new Order();
        o.order_id        = rs.getString("order_id");
        o.customer_id     = rs.getString("customer_id");
        o.customer_name   = rs.getString("customer_name");
        o.customer_email  = rs.getString("customer_email");
        o.customer_phone  = rs.getString("customer_phone");
        o.shipping_address= rs.getString("shipping_address");
        o.city            = rs.getString("city");
        o.postal_code     = rs.getString("postal_code");
        o.order_date      = rs.getString("order_date");
        o.status          = rs.getString("status");
        o.payment_method  = rs.getString("payment_method");
        o.payment_status  = rs.getString("payment_status");
        o.subtotal        = rs.getDouble("subtotal");
        o.discount        = rs.getDouble("discount");
        o.promo_code      = rs.getString("promo_code");
        o.delivery_fee    = rs.getDouble("delivery_fee");
        o.total_amount    = rs.getDouble("total_amount");
        o.staff_name      = rs.getString("staff_name");
        o.vehicle_no      = rs.getString("vehicle_no");
        return o;
    }

    // ==========================================
    // PROMOTIONS
    // ==========================================

    public Collection<Promotion> getAllPromotions() {
        List<Promotion> list = new ArrayList<>();
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM promotions")) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapPromotion(rs));
        } catch (SQLException e) {
            log.severe("getAllPromotions: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return list;
    }

    public Promotion getPromotion(String id) {
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM promotions WHERE promotion_id = ?")) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapPromotion(rs);
        } catch (SQLException e) {
            log.severe("getPromotion: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return null;
    }

    public Promotion getPromotionByCode(String code) {
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM promotions WHERE LOWER(promotion_code) = LOWER(?)")) {
            ps.setString(1, code.trim());
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapPromotion(rs);
        } catch (SQLException e) {
            log.severe("getPromotionByCode: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return null;
    }

    public Promotion addPromotion(Promotion p) {
        if (p.promotion_id == null || p.promotion_id.isEmpty()) {
            p.promotion_id = "promo-" + System.currentTimeMillis();
        }
        if (p.status == null || p.status.isEmpty()) p.status = "ACTIVE";
        String sql = "INSERT INTO promotions (promotion_id, promotion_code, title, description, discount_type, discount_value, min_spend, start_date, end_date, status) VALUES (?,?,?,?,?,?,?,?,?,?)";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1,  p.promotion_id);
            ps.setString(2,  p.promotion_code);
            ps.setString(3,  p.title);
            ps.setString(4,  p.description);
            ps.setString(5,  p.discount_type);
            ps.setDouble(6,  p.discount_value);
            ps.setDouble(7,  p.min_spend);
            ps.setString(8,  p.start_date);
            ps.setString(9,  p.end_date);
            ps.setString(10, p.status);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("addPromotion: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return p;
    }

    public Promotion updatePromotion(String id, Promotion p) {
        Promotion existing = getPromotion(id);
        if (existing == null) return null;
        if (p.promotion_code != null) existing.promotion_code = p.promotion_code;
        if (p.title != null)          existing.title          = p.title;
        if (p.description != null)    existing.description    = p.description;
        if (p.discount_type != null)  existing.discount_type  = p.discount_type;
        if (p.discount_value > 0)     existing.discount_value = p.discount_value;
        if (p.min_spend >= 0)         existing.min_spend      = p.min_spend;
        if (p.start_date != null)     existing.start_date     = p.start_date;
        if (p.end_date != null)       existing.end_date       = p.end_date;
        if (p.status != null)         existing.status         = p.status;
        String sql = "UPDATE promotions SET promotion_code=?, title=?, description=?, discount_type=?, discount_value=?, min_spend=?, start_date=?, end_date=?, status=? WHERE promotion_id=?";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1,  existing.promotion_code);
            ps.setString(2,  existing.title);
            ps.setString(3,  existing.description);
            ps.setString(4,  existing.discount_type);
            ps.setDouble(5,  existing.discount_value);
            ps.setDouble(6,  existing.min_spend);
            ps.setString(7,  existing.start_date);
            ps.setString(8,  existing.end_date);
            ps.setString(9,  existing.status);
            ps.setString(10, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("updatePromotion: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return existing;
    }

    public boolean deletePromotion(String id) {
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("DELETE FROM promotions WHERE promotion_id=?")) {
            ps.setString(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            log.severe("deletePromotion: " + e.getMessage());
            return false;
        } finally {
            db().releaseConnection(conn);
        }
    }

    public boolean hasUserUsedPromotion(String promoCode, String customerEmail, String customerId) {
        if (promoCode == null || promoCode.trim().isEmpty()) return false;
        String code = promoCode.trim().toUpperCase();
        String sql = "SELECT COUNT(*) FROM orders WHERE UPPER(promo_code) = ? " +
                     "AND (status IS NULL OR UPPER(status) != 'CANCELLED') " +
                     "AND ((? IS NOT NULL AND ? != '' AND LOWER(customer_email) = LOWER(?)) " +
                     "  OR (? IS NOT NULL AND ? != '' AND customer_id = ?))";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, code);
            ps.setString(2, customerEmail != null ? customerEmail.trim() : null);
            ps.setString(3, customerEmail != null ? customerEmail.trim() : "");
            ps.setString(4, customerEmail != null ? customerEmail.trim() : "");
            ps.setString(5, customerId != null ? customerId.trim() : null);
            ps.setString(6, customerId != null ? customerId.trim() : "");
            ps.setString(7, customerId != null ? customerId.trim() : "");
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            log.severe("hasUserUsedPromotion: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return false;
    }

    public int getPromotionUsageCount(String promoCode) {
        if (promoCode == null || promoCode.trim().isEmpty()) return 0;
        String sql = "SELECT COUNT(*) FROM orders WHERE UPPER(promo_code) = ? AND (status IS NULL OR UPPER(status) != 'CANCELLED')";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, promoCode.trim().toUpperCase());
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt(1);
        } catch (SQLException e) {
            log.severe("getPromotionUsageCount: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return 0;
    }

    private Promotion mapPromotion(ResultSet rs) throws SQLException {
        Promotion p = new Promotion();
        p.promotion_id   = rs.getString("promotion_id");
        p.promotion_code = rs.getString("promotion_code");
        p.title          = rs.getString("title");
        p.description    = rs.getString("description");
        p.discount_type  = rs.getString("discount_type");
        p.discount_value = rs.getDouble("discount_value");
        p.min_spend      = rs.getDouble("min_spend");
        p.start_date     = rs.getString("start_date");
        p.end_date       = rs.getString("end_date");
        p.status         = rs.getString("status");
        return p;
    }

    // ==========================================
    // REVIEWS
    // ==========================================

    public Collection<Review> getAllReviews() {
        List<Review> list = new ArrayList<>();
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM reviews ORDER BY created_at DESC")) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapReview(rs));
        } catch (SQLException e) {
            log.severe("getAllReviews: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return list;
    }

    public List<Review> getProductReviews(String prodId) {
        List<Review> list = new ArrayList<>();
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC")) {
            ps.setString(1, prodId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapReview(rs));
        } catch (SQLException e) {
            log.severe("getProductReviews: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
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
        r.rating_stars = Review.formatStars(r.rating);
        String sql = "INSERT INTO reviews (review_id, product_id, customer_name, customer_id, customer_email, rating, rating_stars, comment, status, review_date) VALUES (?,?,?,?,?,?,?,?,?,?)";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1,  r.review_id);
            ps.setString(2,  r.product_id);
            ps.setString(3,  r.customer_name);
            ps.setString(4,  r.customer_id != null ? r.customer_id : "");
            ps.setString(5,  r.customer_email != null ? r.customer_email : "");
            ps.setInt(6,     r.rating);
            ps.setString(7,  r.rating_stars);
            ps.setString(8,  r.comment);
            ps.setString(9,  r.status != null ? r.status : "APPROVED");
            ps.setString(10, r.review_date);
            ps.executeUpdate();
        } catch (SQLException e) {
            // Fallback for older table schema without rating_stars column
            String fallbackSql = "INSERT INTO reviews (review_id, product_id, customer_name, customer_id, customer_email, rating, comment, status, review_date) VALUES (?,?,?,?,?,?,?,?,?)";
            try (PreparedStatement ps = conn.prepareStatement(fallbackSql)) {
                ps.setString(1, r.review_id);
                ps.setString(2, r.product_id);
                ps.setString(3, r.customer_name);
                ps.setString(4, r.customer_id != null ? r.customer_id : "");
                ps.setString(5, r.customer_email != null ? r.customer_email : "");
                ps.setInt(6,    r.rating);
                ps.setString(7, r.comment);
                ps.setString(8, r.status != null ? r.status : "APPROVED");
                ps.setString(9, r.review_date);
                ps.executeUpdate();
            } catch (SQLException ex) {
                log.severe("addReview fallback: " + ex.getMessage());
            }
        } finally {
            db().releaseConnection(conn);
        }
        recalculateProductRating(r.product_id);
        return r;
    }

    public Review updateReview(String id, int rating, String comment) {
        String stars = Review.formatStars(rating);
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("UPDATE reviews SET rating=?, rating_stars=?, comment=? WHERE review_id=?")) {
            ps.setInt(1, rating);
            ps.setString(2, stars);
            ps.setString(3, comment);
            ps.setString(4, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            try (PreparedStatement ps2 = conn.prepareStatement("UPDATE reviews SET rating=?, comment=? WHERE review_id=?")) {
                ps2.setInt(1, rating);
                ps2.setString(2, comment);
                ps2.setString(3, id);
                ps2.executeUpdate();
            } catch (SQLException ex) {
                log.severe("updateReview: " + ex.getMessage());
            }
        } finally {
            db().releaseConnection(conn);
        }
        // Return updated review & recalculate
        Connection conn2 = db().getConnection();
        Review updated = null;
        try (PreparedStatement ps = conn2.prepareStatement("SELECT * FROM reviews WHERE review_id=?")) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) updated = mapReview(rs);
        } catch (SQLException e) {
            log.severe("updateReview read: " + e.getMessage());
        } finally {
            db().releaseConnection(conn2);
        }
        if (updated != null) {
            recalculateProductRating(updated.product_id);
        }
        return updated;
    }

    public Review updateReviewStatus(String id, String status) {
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement("UPDATE reviews SET status=? WHERE review_id=?")) {
            ps.setString(1, status);
            ps.setString(2, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.severe("updateReviewStatus: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        // Return updated review
        Connection conn2 = db().getConnection();
        Review updated = null;
        try (PreparedStatement ps = conn2.prepareStatement("SELECT * FROM reviews WHERE review_id=?")) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) updated = mapReview(rs);
        } catch (SQLException e) {
            log.severe("updateReviewStatus read: " + e.getMessage());
        } finally {
            db().releaseConnection(conn2);
        }
        if (updated != null) {
            recalculateProductRating(updated.product_id);
        }
        return updated;
    }

    public boolean deleteReview(String id) {
        String prodId = null;
        Connection connFind = db().getConnection();
        try (PreparedStatement ps = connFind.prepareStatement("SELECT product_id FROM reviews WHERE review_id=?")) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) prodId = rs.getString("product_id");
        } catch (SQLException ignored) {}
        finally {
            db().releaseConnection(connFind);
        }

        Connection conn = db().getConnection();
        boolean deleted = false;
        try (PreparedStatement ps = conn.prepareStatement("DELETE FROM reviews WHERE review_id=?")) {
            ps.setString(1, id);
            deleted = ps.executeUpdate() > 0;
        } catch (SQLException e) {
            log.severe("deleteReview: " + e.getMessage());
            deleted = false;
        } finally {
            db().releaseConnection(conn);
        }

        if (deleted && prodId != null) {
            recalculateProductRating(prodId);
        }
        return deleted;
    }

    public void recalculateProductRating(String productId) {
        if (productId == null || productId.trim().isEmpty()) return;
        Connection conn = db().getConnection();
        try {
            String sqlAvg = "SELECT ROUND(AVG(rating), 1) as avg_rating FROM reviews WHERE product_id=? AND (status='APPROVED' OR status IS NULL)";
            double avg = 5.0;
            try (PreparedStatement ps = conn.prepareStatement(sqlAvg)) {
                ps.setString(1, productId);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    double val = rs.getDouble("avg_rating");
                    if (!rs.wasNull()) avg = val;
                }
            }
            String stars = Product.formatStars(avg);
            try (PreparedStatement psUp = conn.prepareStatement("UPDATE products SET rating=?, rating_stars=? WHERE product_id=?")) {
                psUp.setDouble(1, avg);
                psUp.setString(2, stars);
                psUp.setString(3, productId);
                psUp.executeUpdate();
            } catch (SQLException e) {
                try (PreparedStatement psUp2 = conn.prepareStatement("UPDATE products SET rating=? WHERE product_id=?")) {
                    psUp2.setDouble(1, avg);
                    psUp2.setString(2, productId);
                    psUp2.executeUpdate();
                } catch (SQLException ignored) {}
            }
        } catch (SQLException e) {
            log.warning("recalculateProductRating: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
    }

    private Review mapReview(ResultSet rs) throws SQLException {
        Review r = new Review();
        r.review_id     = rs.getString("review_id");
        r.product_id    = rs.getString("product_id");
        r.customer_name = rs.getString("customer_name");
        try { r.customer_id = rs.getString("customer_id"); } catch (Exception ignored) {}
        try { r.customer_email = rs.getString("customer_email"); } catch (Exception ignored) {}
        r.rating        = rs.getInt("rating");
        r.rating_stars  = Review.formatStars(r.rating);
        r.comment       = rs.getString("comment");
        r.status        = rs.getString("status");
        r.review_date   = rs.getString("review_date");
        return r;
    }

    // ==========================================
    // STORED PROCEDURES & FUNCTIONS WRAPPERS
    // ==========================================

    /**
     * Executes stored procedure sp_place_order_from_cart to atomically process an order.
     */
    public Map<String, Object> placeOrderViaProcedure(String userId, String customerName, String customerEmail,
                                                      String customerPhone, String shippingAddress, String city,
                                                      String postalCode, String paymentMethod, String promoCode,
                                                      double deliveryFee) {
        Map<String, Object> res = new HashMap<>();
        String sql = "{CALL sp_place_order_from_cart(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";
        Connection conn = db().getConnection();
        try (CallableStatement cs = conn.prepareCall(sql)) {
            cs.setString(1, userId);
            cs.setString(2, customerName);
            cs.setString(3, customerEmail);
            cs.setString(4, customerPhone);
            cs.setString(5, shippingAddress);
            cs.setString(6, city);
            cs.setString(7, postalCode);
            cs.setString(8, paymentMethod != null ? paymentMethod : "Cash on Delivery");
            cs.setString(9, promoCode);
            cs.setDouble(10, deliveryFee);

            // Register OUT parameters
            cs.registerOutParameter(11, Types.VARCHAR); // p_order_id
            cs.registerOutParameter(12, Types.DOUBLE);  // p_total_amount
            cs.registerOutParameter(13, Types.INTEGER); // p_status_code
            cs.registerOutParameter(14, Types.VARCHAR); // p_message

            cs.execute();

            res.put("order_id", cs.getString(11));
            res.put("total_amount", cs.getDouble(12));
            res.put("status_code", cs.getInt(13));
            res.put("message", cs.getString(14));
            res.put("success", cs.getInt(13) == 0);
        } catch (SQLException e) {
            log.severe("placeOrderViaProcedure: " + e.getMessage());
            res.put("success", false);
            res.put("status_code", 99);
            res.put("message", e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return res;
    }

    /**
     * Executes stored procedure sp_cancel_order with automatic stock restoration.
     */
    public Map<String, Object> cancelOrderViaProcedure(String orderId, String reason) {
        Map<String, Object> res = new HashMap<>();
        String sql = "{CALL sp_cancel_order(?, ?, ?, ?)}";
        Connection conn = db().getConnection();
        try (CallableStatement cs = conn.prepareCall(sql)) {
            cs.setString(1, orderId);
            cs.setString(2, reason != null ? reason : "Cancelled by user");
            cs.registerOutParameter(3, Types.BOOLEAN); // p_success
            cs.registerOutParameter(4, Types.VARCHAR); // p_message

            cs.execute();

            res.put("success", cs.getBoolean(3));
            res.put("message", cs.getString(4));
        } catch (SQLException e) {
            log.severe("cancelOrderViaProcedure: " + e.getMessage());
            res.put("success", false);
            res.put("message", e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return res;
    }

    /**
     * Executes stored procedure sp_restock_product with automatic inventory logging.
     */
    public Map<String, Object> restockProductViaProcedure(String productId, int addQty) {
        Map<String, Object> res = new HashMap<>();
        String sql = "{CALL sp_restock_product(?, ?, ?, ?)}";
        Connection conn = db().getConnection();
        try (CallableStatement cs = conn.prepareCall(sql)) {
            cs.setString(1, productId);
            cs.setInt(2, addQty);
            cs.registerOutParameter(3, Types.INTEGER); // p_new_stock
            cs.registerOutParameter(4, Types.VARCHAR); // p_status_msg

            cs.execute();

            res.put("new_stock", cs.getInt(3));
            res.put("message", cs.getString(4));
            res.put("success", true);
        } catch (SQLException e) {
            log.severe("restockProductViaProcedure: " + e.getMessage());
            res.put("success", false);
            res.put("message", e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return res;
    }

    /**
     * Executes stored procedure sp_apply_promotional_discount to re-evaluate a pending order.
     */
    public Map<String, Object> applyPromoCodeViaProcedure(String orderId, String promoCode) {
        Map<String, Object> res = new HashMap<>();
        String sql = "{CALL sp_apply_promotional_discount(?, ?, ?, ?, ?)}";
        Connection conn = db().getConnection();
        try (CallableStatement cs = conn.prepareCall(sql)) {
            cs.setString(1, orderId);
            cs.setString(2, promoCode);
            cs.registerOutParameter(3, Types.DOUBLE);  // p_discount
            cs.registerOutParameter(4, Types.DOUBLE);  // p_new_total
            cs.registerOutParameter(5, Types.VARCHAR); // p_message

            cs.execute();

            res.put("discount", cs.getDouble(3));
            res.put("new_total", cs.getDouble(4));
            res.put("message", cs.getString(5));
            res.put("success", cs.getDouble(3) > 0);
        } catch (SQLException e) {
            log.severe("applyPromoCodeViaProcedure: " + e.getMessage());
            res.put("success", false);
            res.put("message", e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return res;
    }

    /**
     * Executes stored function fn_calculate_discount in MySQL.
     */
    public double calculateDiscountViaFunction(double subtotal, String promoCode) {
        String sql = "SELECT fn_calculate_discount(?, ?) AS discount";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, subtotal);
            ps.setString(2, promoCode);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getDouble("discount");
        } catch (SQLException e) {
            log.severe("calculateDiscountViaFunction: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return 0.0;
    }

    /**
     * Executes stored function fn_get_customer_loyalty_points in MySQL.
     */
    public int getCustomerLoyaltyPointsViaFunction(String customerId) {
        String sql = "SELECT fn_get_customer_loyalty_points(?) AS points";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, customerId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt("points");
        } catch (SQLException e) {
            log.severe("getCustomerLoyaltyPointsViaFunction: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return 0;
    }

    /**
     * Executes stored function fn_get_product_stock_status in MySQL.
     */
    public String getProductStockStatusViaFunction(String productId) {
        String sql = "SELECT fn_get_product_stock_status(?) AS status";
        Connection conn = db().getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, productId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getString("status");
        } catch (SQLException e) {
            log.severe("getProductStockStatusViaFunction: " + e.getMessage());
        } finally {
            db().releaseConnection(conn);
        }
        return "UNKNOWN";
    }
}
