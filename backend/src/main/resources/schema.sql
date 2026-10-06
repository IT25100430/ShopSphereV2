-- =====================================================
-- ShopSphere Database Schema
-- Auto-executed on first startup via DatabaseManager
-- =====================================================

CREATE DATABASE IF NOT EXISTS shopsphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shopsphere;

-- =====================================================
-- TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    category_id VARCHAR(64) PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '🏷️',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
    brand_id VARCHAR(64) PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    origin VARCHAR(100) DEFAULT 'International',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(64) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category_id VARCHAR(64),
    brand_id VARCHAR(64),
    price DOUBLE NOT NULL DEFAULT 0.0,
    stock_qty INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    description TEXT,
    rating DOUBLE DEFAULT 5.0,
    rating_stars VARCHAR(10) DEFAULT '★★★★★',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS promotions (
    promotion_id VARCHAR(64) PRIMARY KEY,
    promotion_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255),
    description TEXT,
    discount_type VARCHAR(50) DEFAULT 'PERCENTAGE',
    discount_value DOUBLE DEFAULT 10.0,
    min_spend DOUBLE DEFAULT 0.0,
    start_date VARCHAR(50) DEFAULT '2026-01-01',
    end_date VARCHAR(50) DEFAULT '2026-12-31',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) DEFAULT 'usr-cust-01',
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    shipping_address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    order_date VARCHAR(64),
    status VARCHAR(50) DEFAULT 'PENDING',
    payment_method VARCHAR(100) DEFAULT 'Cash on Delivery',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    subtotal DOUBLE DEFAULT 0.0,
    discount DOUBLE DEFAULT 0.0,
    promo_code VARCHAR(50),
    delivery_fee DOUBLE DEFAULT 350.0,
    total_amount DOUBLE DEFAULT 0.0,
    staff_name VARCHAR(255) DEFAULT 'Express Courier Partner',
    vehicle_no VARCHAR(50) DEFAULT 'WP-CA-8842',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    product_id VARCHAR(64),
    product_name VARCHAR(255),
    price DOUBLE,
    quantity INT,
    image_url TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS carts (
    cart_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    item_id VARCHAR(64) PRIMARY KEY,
    cart_id VARCHAR(64) NOT NULL,
    product_id VARCHAR(64),
    quantity INT DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
    review_id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64),
    customer_name VARCHAR(255) DEFAULT 'Verified Customer',
    customer_id VARCHAR(64),
    customer_email VARCHAR(255),
    rating INT DEFAULT 5,
    rating_stars VARCHAR(10) DEFAULT '★★★★★',
    comment TEXT,
    status VARCHAR(50) DEFAULT 'APPROVED',
    review_date VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SEED DATA (only inserted if tables are empty)
-- =====================================================

-- Users
INSERT IGNORE INTO users (user_id, name, email, password, phone, role) VALUES
('usr-admin-01', 'Admin Manager', 'admin@shopsphere.com', 'password123', '+94 77 123 4567', 'ADMINISTRATOR'),
('usr-admin-lk', 'Dilshan Perera', 'admin@shopsphere.lk', 'password123', '+94 77 123 4567', 'ADMINISTRATOR'),
('usr-cust-01', 'Customer Kasun', 'customer@shopsphere.com', 'password123', '+94 77 890 1234', 'CUSTOMER'),
('usr-cust-lk', 'Kasun Jayasinghe', 'kasun@gmail.com', 'password123', '+94 77 890 1234', 'CUSTOMER'),
('usr-vend-01', 'Official Apple Partner', 'vendor@shopsphere.com', 'password123', '+94 77 555 1234', 'VENDOR'),
('usr-deliv-01', 'Courier Sunil', 'courier@shopsphere.com', 'password123', '+94 71 901 2345', 'DELIVERY_STAFF'),
('usr-deliv-lk', 'Sunil Rathnayake', 'delivery@shopsphere.lk', 'password123', '+94 71 901 2345', 'DELIVERY_STAFF');

-- Categories
INSERT IGNORE INTO categories (category_id, category_name, description, icon) VALUES
('cat-1', 'Electronics', 'High-tech smart gadgets, audio, and laptops.', '📱'),
('cat-2', 'Fashion & Apparel', 'Footwear, sportswear, and designer clothing.', '👕'),
('cat-3', 'Home & Living', 'Modern furniture, ambient lighting, and appliances.', '🏠'),
('cat-4', 'Beauty & Personal Care', 'Organic skincare sets and wellness essentials.', '💄'),
('cat-5', 'Sports & Fitness', 'Workout gear and sporting goods.', '⚽');

-- Brands
INSERT IGNORE INTO brands (brand_id, brand_name, description, origin) VALUES
('brd-1', 'Apple', 'Premium computing & electronics', 'United States'),
('brd-2', 'Sony', 'Audio & visual entertainment', 'Japan'),
('brd-3', 'Nike', 'Athletic footwear & sportswear', 'United States'),
('brd-4', 'IKEA', 'Minimalist home furniture', 'Sweden'),
('brd-5', 'Samsung', 'Smartphones & displays', 'South Korea'),
('brd-6', 'Philips', 'Home appliances & lighting', 'Netherlands');

-- Products
INSERT IGNORE INTO products (product_id, product_name, category_id, brand_id, price, stock_qty, image_url, description, rating, rating_stars, status) VALUES
('prod-1', 'Wireless Noise-Cancelling Headphones', 'cat-1', 'brd-2', 12999.0, 18, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', 'Premium noise-cancelling headphones with 30-hour battery life.', 4.8, '★★★★★', 'ACTIVE'),
('prod-2', 'Smart Watch Series 9 GPS', 'cat-1', 'brd-1', 15999.0, 12, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', 'Smartwatch with ECG, heart-rate tracking, and Retina display.', 4.7, '★★★★★', 'ACTIVE'),
('prod-3', 'Classic Urban Cotton T-Shirt', 'cat-2', 'brd-3', 2999.0, 35, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80', '100% breathable organic cotton crewneck tee.', 4.3, '★★★★☆', 'ACTIVE'),
('prod-4', 'Air Flow Running Shoes', 'cat-2', 'brd-3', 8999.0, 8, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', 'Ultra-lightweight running sneakers with responsive cushioning.', 4.6, '★★★★★', 'ACTIVE'),
('prod-5', 'Smart Drip Coffee Maker', 'cat-3', 'brd-6', 11999.0, 3, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', 'Programmable 12-cup drip coffee maker with permanent filter.', 4.4, '★★★★☆', 'ACTIVE'),
('prod-6', 'Organic Hydrating Skincare Set', 'cat-4', 'brd-4', 4999.0, 22, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80', '3-step botanical facial cleanser, toner, and serum.', 4.8, '★★★★★', 'ACTIVE'),
('prod-7', 'Galaxy Pro 5G Smartphone', 'cat-1', 'brd-5', 89999.0, 6, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', '6.7-inch AMOLED 120Hz display with triple 108MP camera.', 4.9, '★★★★★', 'ACTIVE'),
('prod-8', 'Ultra-Thin Work & Gaming Laptop', 'cat-1', 'brd-1', 189999.0, 4, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', 'High-performance laptop with 16GB RAM and 512GB SSD.', 4.7, '★★★★★', 'ACTIVE');

-- Promotions
INSERT IGNORE INTO promotions (promotion_id, promotion_code, title, description, discount_type, discount_value, min_spend, status) VALUES
('promo-1', 'SAVE10', '10% Welcome Discount', 'Get 10% off your entire order!', 'PERCENTAGE', 10.0, 0.0, 'ACTIVE'),
('promo-2', 'FLAT500', 'Flat Rs. 500 Off', 'Rs. 500 off on orders over Rs. 5,000', 'FIXED_AMOUNT', 500.0, 5000.0, 'ACTIVE'),
('promo-3', 'MALL2026', 'Grand Mall Celebration', '15% off orders above Rs. 10,000', 'PERCENTAGE', 15.0, 10000.0, 'ACTIVE');

-- Reviews (1 - 5 stars)
INSERT IGNORE INTO reviews (review_id, product_id, customer_name, customer_id, customer_email, rating, rating_stars, comment, status, review_date) VALUES
('rev-1', 'prod-1', 'Nadeesha K.', 'usr-cust-01', 'customer@shopsphere.com', 5, '★★★★★', 'Exceptional noise cancellation and battery life!', 'APPROVED', '2026-09-10T10:00:00Z'),
('rev-2', 'prod-1', 'Kavinda S.', 'usr-cust-lk', 'kasun@gmail.com', 5, '★★★★★', 'Deep bass and very comfortable to wear for work calls.', 'APPROVED', '2026-09-12T14:20:00Z'),
('rev-3', 'prod-2', 'Chathura M.', 'usr-cust-01', 'customer@shopsphere.com', 5, '★★★★★', 'Screen is very bright outdoors. Great tracking.', 'APPROVED', '2026-09-11T12:00:00Z'),
('rev-4', 'prod-2', 'Dilani W.', 'usr-cust-lk', 'kasun@gmail.com', 4, '★★★★☆', 'Accurate step counting and heart sensor. Battery lasts 2 days.', 'APPROVED', '2026-09-13T16:45:00Z'),
('rev-5', 'prod-3', 'Nuwan F.', 'usr-cust-01', 'customer@shopsphere.com', 4, '★★★★☆', 'Comfortable fabric and fits true to size.', 'APPROVED', '2026-09-11T08:15:00Z'),
('rev-6', 'prod-3', 'Sachini D.', 'usr-cust-lk', 'kasun@gmail.com', 5, '★★★★★', 'Very durable cotton, retains shape after multiple washes.', 'APPROVED', '2026-09-14T11:30:00Z'),
('rev-7', 'prod-4', 'Mahesh P.', 'usr-cust-01', 'customer@shopsphere.com', 4, '★★★★☆', 'Very comfortable running shoes for morning jogs.', 'APPROVED', '2026-09-12T09:00:00Z'),
('rev-8', 'prod-4', 'Tharindu B.', 'usr-cust-lk', 'kasun@gmail.com', 5, '★★★★★', 'Super light on feet and responsive cushioning on asphalt.', 'APPROVED', '2026-09-15T18:10:00Z'),
('rev-9', 'prod-5', 'Kamal S.', 'usr-cust-01', 'customer@shopsphere.com', 4, '★★★★☆', 'Brews quickly and looks elegant in the kitchen.', 'APPROVED', '2026-09-15T07:00:00Z'),
('rev-10', 'prod-5', 'Anusha R.', 'usr-cust-lk', 'kasun@gmail.com', 5, '★★★★★', 'Timer feature ensures hot coffee ready as soon as I wake up.', 'APPROVED', '2026-09-16T06:40:00Z'),
('rev-11', 'prod-6', 'Shehani M.', 'usr-cust-01', 'customer@shopsphere.com', 5, '★★★★★', 'Natural glow within a week! Does not feel greasy at all.', 'APPROVED', '2026-09-13T10:20:00Z'),
('rev-12', 'prod-6', 'Prabash L.', 'usr-cust-lk', 'kasun@gmail.com', 5, '★★★★★', 'High quality organic formulation, gentle on sensitive skin.', 'APPROVED', '2026-09-17T15:00:00Z'),
('rev-13', 'prod-7', 'Ashen G.', 'usr-cust-01', 'customer@shopsphere.com', 5, '★★★★★', '120Hz display is stunning and camera zoom is unbeatable.', 'APPROVED', '2026-09-14T19:30:00Z'),
('rev-14', 'prod-7', 'Ruvini T.', 'usr-cust-lk', 'kasun@gmail.com', 5, '★★★★★', 'Ultra-fast charging and top tier gaming performance.', 'APPROVED', '2026-09-18T13:45:00Z'),
('rev-15', 'prod-8', 'Dineth J.', 'usr-cust-01', 'customer@shopsphere.com', 5, '★★★★★', 'Handles intensive programming and render jobs effortlessly.', 'APPROVED', '2026-09-15T12:00:00Z'),
('rev-16', 'prod-8', 'Hansani K.', 'usr-cust-lk', 'kasun@gmail.com', 4, '★★★★☆', 'Crisp display, fast boot time, and silent cooling fans.', 'APPROVED', '2026-09-19T14:15:00Z');

UPDATE reviews SET status = 'APPROVED' WHERE status IS NULL OR status = 'PENDING';

-- Sample Order
INSERT IGNORE INTO orders (order_id, customer_id, customer_name, customer_email, customer_phone, shipping_address, city, order_date, status, payment_method, payment_status, subtotal, discount, promo_code, total_amount) VALUES
('ORD-902101', 'usr-cust-01', 'Kasun Jayasinghe', 'customer@shopsphere.com', '0778901234', 'No 45, Galle Road, Colombo 03', 'Colombo', '2026-09-14T14:32:00Z', 'SHIPPED', 'Credit / Debit Card', 'COMPLETED', 15999.0, 1599.9, 'SAVE10', 14749.1);

INSERT IGNORE INTO order_items (order_id, product_id, product_name, price, quantity, image_url) VALUES
('ORD-902101', 'prod-2', 'Smart Watch Series 9 GPS', 15999.0, 1, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80');

-- Default cart for customer
INSERT IGNORE INTO carts (cart_id, user_id) VALUES ('cart-cust-01', 'usr-cust-01');
INSERT IGNORE INTO cart_items (item_id, cart_id, product_id, quantity) VALUES ('item-1', 'cart-cust-01', 'prod-1', 1);

-- Safe migrations for existing databases
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DOUBLE DEFAULT 5.0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating_stars VARCHAR(10) DEFAULT '★★★★★';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_id VARCHAR(64);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating INT DEFAULT 5;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_stars VARCHAR(10) DEFAULT '★★★★★';

UPDATE products SET rating_stars = CASE
    WHEN ROUND(rating) >= 5 THEN '★★★★★'
    WHEN ROUND(rating) = 4 THEN '★★★★☆'
    WHEN ROUND(rating) = 3 THEN '★★★☆☆'
    WHEN ROUND(rating) = 2 THEN '★★☆☆☆'
    ELSE '★☆☆☆☆'
END;

UPDATE reviews SET rating_stars = CASE
    WHEN rating >= 5 THEN '★★★★★'
    WHEN rating = 4 THEN '★★★★☆'
    WHEN rating = 3 THEN '★★★☆☆'
    WHEN rating = 2 THEN '★★☆☆☆'
    ELSE '★☆☆☆☆'
END;
