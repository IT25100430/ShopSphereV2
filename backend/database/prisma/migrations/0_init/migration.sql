-- SQL Migration Script for Shop Sphere System (Web-Based Shopping Mall System)
-- Target RDBMS: PostgreSQL (also adaptable to MySQL / MariaDB / SQLite)
-- Derived from EER Diagram and Project Requirements (Group MLB-B8G1-08)

BEGIN;

-- ==========================================
-- Create Custom Enum Types
-- ==========================================

CREATE TYPE "UserRole" AS ENUM (
    'ADMINISTRATOR', 
    'CUSTOMER', 
    'VENDOR', 
    'DELIVERY_STAFF'
);

CREATE TYPE "ProductStatus" AS ENUM (
    'ACTIVE', 
    'OUT_OF_STOCK', 
    'DISCONTINUED', 
    'INACTIVE'
);

CREATE TYPE "CartStatus" AS ENUM (
    'ACTIVE', 
    'CHECKED_OUT', 
    'ABANDONED'
);

CREATE TYPE "OrderStatus" AS ENUM (
    'PENDING', 
    'CONFIRMED', 
    'PROCESSING', 
    'SHIPPED', 
    'DELIVERED', 
    'CANCELLED'
);

CREATE TYPE "PaymentMethod" AS ENUM (
    'CREDIT_CARD', 
    'DEBIT_CARD', 
    'PAYPAL', 
    'CASH_ON_DELIVERY', 
    'BANK_TRANSFER'
);

CREATE TYPE "PaymentStatus" AS ENUM (
    'PENDING', 
    'COMPLETED', 
    'FAILED', 
    'REFUNDED'
);

CREATE TYPE "DiscountType" AS ENUM (
    'PERCENTAGE', 
    'FIXED_AMOUNT'
);

CREATE TYPE "PromotionStatus" AS ENUM (
    'ACTIVE', 
    'EXPIRED', 
    'INACTIVE'
);

CREATE TYPE "DeliveryStatus" AS ENUM (
    'PENDING', 
    'OUT_FOR_DELIVERY', 
    'DELIVERED', 
    'FAILED', 
    'RESCHEDULED'
);

CREATE TYPE "ReviewStatus" AS ENUM (
    'PENDING', 
    'APPROVED', 
    'REJECTED'
);

CREATE TYPE "AvailabilityStatus" AS ENUM (
    'AVAILABLE', 
    'ON_DELIVERY', 
    'OFF_DUTY'
);

-- ==========================================
-- 1. Identity & Access (User Superclass & ISA Subclasses)
-- ==========================================

-- Superclass: Users
CREATE TABLE "users" (
    "user_id" VARCHAR(36) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subclass: Administrators
CREATE TABLE "administrators" (
    "user_id" VARCHAR(36) PRIMARY KEY,
    "admin_level" VARCHAR(100) NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);

-- Subclass: Customers
CREATE TABLE "customers" (
    "user_id" VARCHAR(36) PRIMARY KEY,
    "shipping_address" TEXT,
    "loyalty_points" INT DEFAULT 0,
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);

-- Subclass: Vendors
CREATE TABLE "vendors" (
    "user_id" VARCHAR(36) PRIMARY KEY,
    "business_reg_no" VARCHAR(100) UNIQUE NOT NULL,
    "business_name" VARCHAR(255) NOT NULL,
    "admin_id" VARCHAR(36),
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE,
    FOREIGN KEY ("admin_id") REFERENCES "administrators"("user_id") ON DELETE SET NULL
);

-- Subclass: Delivery Staff
CREATE TABLE "delivery_staff" (
    "user_id" VARCHAR(36) PRIMARY KEY,
    "availability_status" "AvailabilityStatus" DEFAULT 'AVAILABLE',
    "vehicle_no" VARCHAR(50) NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);

-- ==========================================
-- 2. Product Catalog Management
-- ==========================================

-- Categories (Supports recursive sub-categories)
CREATE TABLE "categories" (
    "category_id" VARCHAR(36) PRIMARY KEY,
    "category_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "parent_id" VARCHAR(36),
    FOREIGN KEY ("parent_id") REFERENCES "categories"("category_id") ON DELETE SET NULL
);

-- Brands
CREATE TABLE "brands" (
    "brand_id" VARCHAR(36) PRIMARY KEY,
    "brand_name" VARCHAR(255) NOT NULL,
    "description" TEXT
);

-- Products
CREATE TABLE "products" (
    "product_id" VARCHAR(36) PRIMARY KEY,
    "product_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "price" DECIMAL(10, 2) NOT NULL,
    "stock_qty" INT DEFAULT 0,
    "status" "ProductStatus" DEFAULT 'ACTIVE',
    "rating" DECIMAL(2, 1) DEFAULT 5.0,
    "rating_stars" VARCHAR(10) DEFAULT '★★★★★',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "category_id" VARCHAR(36) NOT NULL,
    "brand_id" VARCHAR(36) NOT NULL,
    "vendor_id" VARCHAR(36),
    FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT,
    FOREIGN KEY ("brand_id") REFERENCES "brands"("brand_id") ON DELETE RESTRICT,
    FOREIGN KEY ("vendor_id") REFERENCES "vendors"("user_id") ON DELETE SET NULL
);

-- ==========================================
-- 3. Shopping Cart System
-- ==========================================

-- Carts
CREATE TABLE "carts" (
    "cart_id" VARCHAR(36) PRIMARY KEY,
    "customer_id" VARCHAR(36) NOT NULL,
    "status" "CartStatus" DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customer_id") REFERENCES "customers"("user_id") ON DELETE CASCADE
);

-- Cart Items
CREATE TABLE "cart_items" (
    "cart_item_id" VARCHAR(36) PRIMARY KEY,
    "cart_id" VARCHAR(36) NOT NULL,
    "product_id" VARCHAR(36) NOT NULL,
    "quantity" INT NOT NULL DEFAULT 1,
    FOREIGN KEY ("cart_id") REFERENCES "carts"("cart_id") ON DELETE CASCADE,
    FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE
);

-- ==========================================
-- 4. Order Management & Checkout
-- ==========================================

-- Orders
CREATE TABLE "orders" (
    "order_id" VARCHAR(36) PRIMARY KEY,
    "customer_id" VARCHAR(36) NOT NULL,
    "cart_id" VARCHAR(36) UNIQUE,
    "order_date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "shipping_address" TEXT NOT NULL,
    "status" "OrderStatus" DEFAULT 'PENDING',
    "total_amount" DECIMAL(10, 2) NOT NULL,
    "staff_id" VARCHAR(36),
    FOREIGN KEY ("customer_id") REFERENCES "customers"("user_id") ON DELETE RESTRICT,
    FOREIGN KEY ("cart_id") REFERENCES "carts"("cart_id") ON DELETE SET NULL,
    FOREIGN KEY ("staff_id") REFERENCES "delivery_staff"("user_id") ON DELETE SET NULL
);

-- Order Items
CREATE TABLE "order_items" (
    "order_item_id" VARCHAR(36) PRIMARY KEY,
    "order_id" VARCHAR(36) NOT NULL,
    "product_id" VARCHAR(36) NOT NULL,
    "quantity" INT NOT NULL,
    "unit_price" DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE,
    FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT
);

-- ==========================================
-- 5. Payments, Promotions & Deliveries
-- ==========================================

-- Payments (1:1 with Orders)
CREATE TABLE "payments" (
    "payment_id" VARCHAR(36) PRIMARY KEY,
    "order_id" VARCHAR(36) UNIQUE NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" DEFAULT 'PENDING',
    "payment_date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE
);

-- Promotions
CREATE TABLE "promotions" (
    "promotion_id" VARCHAR(36) PRIMARY KEY,
    "promotion_code" VARCHAR(50) UNIQUE NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10, 2) NOT NULL,
    "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "status" "PromotionStatus" DEFAULT 'ACTIVE'
);

-- Order Promotions (Associative Table for M:N Order <-> Promotion)
CREATE TABLE "order_promotions" (
    "order_id" VARCHAR(36) NOT NULL,
    "promotion_id" VARCHAR(36) NOT NULL,
    PRIMARY KEY ("order_id", "promotion_id"),
    FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE,
    FOREIGN KEY ("promotion_id") REFERENCES "promotions"("promotion_id") ON DELETE CASCADE
);

-- Deliveries
CREATE TABLE "deliveries" (
    "delivery_id" VARCHAR(36) PRIMARY KEY,
    "order_id" VARCHAR(36) UNIQUE NOT NULL,
    "staff_id" VARCHAR(36),
    "status" "DeliveryStatus" DEFAULT 'PENDING',
    "scheduled_date" TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE,
    FOREIGN KEY ("staff_id") REFERENCES "delivery_staff"("user_id") ON DELETE SET NULL
);

-- ==========================================
-- 6. Customer Reviews & Moderation
-- ==========================================

-- Reviews
CREATE TABLE "reviews" (
    "review_id" VARCHAR(36) PRIMARY KEY,
    "customer_id" VARCHAR(36) NOT NULL,
    "product_id" VARCHAR(36) NOT NULL,
    "comment" TEXT,
    "rating" INT NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
    "rating_stars" VARCHAR(10) DEFAULT '★★★★★',
    "status" "ReviewStatus" DEFAULT 'PENDING',
    "review_date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "moderated_by_id" VARCHAR(36),
    FOREIGN KEY ("customer_id") REFERENCES "customers"("user_id") ON DELETE CASCADE,
    FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE,
    FOREIGN KEY ("moderated_by_id") REFERENCES "administrators"("user_id") ON DELETE SET NULL
);

COMMIT;
