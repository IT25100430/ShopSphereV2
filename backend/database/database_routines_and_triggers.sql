-- =====================================================================
-- ShopSphere Database: Stored Functions, Stored Procedures & Triggers
-- Target Database: MySQL 5.7+ / 8.0+ / MariaDB 10.4+
-- =====================================================================

USE shopsphere;

-- =====================================================================
-- 1. AUDIT & LOGGING TABLES
-- =====================================================================

-- Inventory changes audit log
CREATE TABLE IF NOT EXISTS audit_inventory_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL,
    old_stock INT NOT NULL,
    new_stock INT NOT NULL,
    change_qty INT NOT NULL,
    action_type VARCHAR(50) DEFAULT 'STOCK_UPDATE',
    reason VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_inv_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Price modification audit log
CREATE TABLE IF NOT EXISTS audit_price_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL,
    old_price DOUBLE NOT NULL,
    new_price DOUBLE NOT NULL,
    changed_by VARCHAR(64) DEFAULT 'SYSTEM',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_price_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order status transitions audit log
CREATE TABLE IF NOT EXISTS audit_order_status_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_status (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 2. STORED FUNCTIONS
-- =====================================================================

DELIMITER $$

-- ---------------------------------------------------------------------
-- Function 1: fn_calculate_discount
-- Computes the discount for a given subtotal based on promo code rules
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_calculate_discount$$
CREATE FUNCTION fn_calculate_discount(
    p_subtotal DOUBLE,
    p_promo_code VARCHAR(50)
)
RETURNS DOUBLE
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_discount DOUBLE DEFAULT 0.0;
    DECLARE v_discount_type VARCHAR(50);
    DECLARE v_discount_value DOUBLE DEFAULT 0.0;
    DECLARE v_min_spend DOUBLE DEFAULT 0.0;
    DECLARE v_status VARCHAR(50);
    DECLARE v_start_date VARCHAR(50);
    DECLARE v_end_date VARCHAR(50);
    DECLARE v_today VARCHAR(50);

    -- If promo code is null or empty, return 0
    IF p_promo_code IS NULL OR TRIM(p_promo_code) = '' THEN
        RETURN 0.0;
    END IF;

    -- Look up promo in promotions table
    SELECT discount_type, discount_value, min_spend, status, start_date, end_date
    INTO v_discount_type, v_discount_value, v_min_spend, v_status, v_start_date, v_end_date
    FROM promotions
    WHERE UPPER(promotion_code) = UPPER(TRIM(p_promo_code))
    LIMIT 1;

    -- Return 0 if promotion not found or not ACTIVE
    IF v_discount_type IS NULL OR UPPER(v_status) <> 'ACTIVE' THEN
        RETURN 0.0;
    END IF;

    -- Check minimum spend requirement
    IF p_subtotal < v_min_spend THEN
        RETURN 0.0;
    END IF;

    -- Calculate based on discount type
    IF UPPER(v_discount_type) = 'PERCENTAGE' THEN
        SET v_discount = ROUND(p_subtotal * (v_discount_value / 100.0), 2);
    ELSEIF UPPER(v_discount_type) = 'FIXED_AMOUNT' THEN
        SET v_discount = LEAST(v_discount_value, p_subtotal);
    ELSE
        SET v_discount = 0.0;
    END IF;

    RETURN v_discount;
END$$

-- ---------------------------------------------------------------------
-- Function 2: fn_calculate_order_total
-- Computes the final order total ensuring it is non-negative
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_calculate_order_total$$
CREATE FUNCTION fn_calculate_order_total(
    p_subtotal DOUBLE,
    p_discount DOUBLE,
    p_delivery_fee DOUBLE
)
RETURNS DOUBLE
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_subtotal DOUBLE DEFAULT 0.0;
    DECLARE v_discount DOUBLE DEFAULT 0.0;
    DECLARE v_fee DOUBLE DEFAULT 0.0;
    DECLARE v_total DOUBLE DEFAULT 0.0;

    SET v_subtotal = IFNULL(p_subtotal, 0.0);
    SET v_discount = IFNULL(p_discount, 0.0);
    SET v_fee      = IFNULL(p_delivery_fee, 0.0);

    SET v_total = (v_subtotal - v_discount) + v_fee;

    RETURN GREATEST(0.0, ROUND(v_total, 2));
END$$

-- ---------------------------------------------------------------------
-- Function 3: fn_get_customer_total_spent
-- Calculates the total lifetime spend for a customer (excluding cancelled orders)
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_get_customer_total_spent$$
CREATE FUNCTION fn_get_customer_total_spent(
    p_customer_id VARCHAR(64)
)
RETURNS DOUBLE
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total_spent DOUBLE DEFAULT 0.0;

    SELECT COALESCE(SUM(total_amount), 0.0)
    INTO v_total_spent
    FROM orders
    WHERE customer_id = p_customer_id
      AND UPPER(status) NOT IN ('CANCELLED', 'FAILED');

    RETURN ROUND(v_total_spent, 2);
END$$

-- ---------------------------------------------------------------------
-- Function 4: fn_get_customer_loyalty_points
-- Calculates loyalty points earned by a customer (1 point per 100 spent)
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_get_customer_loyalty_points$$
CREATE FUNCTION fn_get_customer_loyalty_points(
    p_customer_id VARCHAR(64)
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_spent DOUBLE DEFAULT 0.0;
    DECLARE v_points INT DEFAULT 0;

    SET v_spent = fn_get_customer_total_spent(p_customer_id);
    SET v_points = FLOOR(v_spent / 100.0);

    RETURN v_points;
END$$

-- ---------------------------------------------------------------------
-- Function 5: fn_get_product_stock_status
-- Returns human-readable inventory health status
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_get_product_stock_status$$
CREATE FUNCTION fn_get_product_stock_status(
    p_product_id VARCHAR(64)
)
RETURNS VARCHAR(30)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_stock INT;
    DECLARE v_threshold INT;
    DECLARE v_deleted TINYINT(1);
    DECLARE v_status VARCHAR(50);

    SELECT stock_qty, low_stock_threshold, is_deleted, status
    INTO v_stock, v_threshold, v_deleted, v_status
    FROM products
    WHERE product_id = p_product_id
    LIMIT 1;

    IF v_stock IS NULL THEN
        RETURN 'NOT_FOUND';
    ELSEIF v_deleted = 1 OR UPPER(v_status) = 'DISCONTINUED' THEN
        RETURN 'DISCONTINUED';
    ELSEIF v_stock <= 0 THEN
        RETURN 'OUT_OF_STOCK';
    ELSEIF v_stock <= v_threshold THEN
        RETURN 'LOW_STOCK';
    ELSE
        RETURN 'IN_STOCK';
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Function 6: fn_get_product_avg_rating
-- Calculates average star rating for a product from approved reviews
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_get_product_avg_rating$$
CREATE FUNCTION fn_get_product_avg_rating(
    p_product_id VARCHAR(64)
)
RETURNS DOUBLE
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_avg DOUBLE DEFAULT 5.0;

    SELECT COALESCE(ROUND(AVG(rating), 1), 5.0)
    INTO v_avg
    FROM reviews
    WHERE product_id = p_product_id
      AND (status = 'APPROVED' OR status IS NULL);

    RETURN v_avg;
END$$

-- ---------------------------------------------------------------------
-- Function 6b: fn_get_product_rating_stars
-- Returns Unicode rating stars (e.g. ★★★★★, ★★★★☆) for a product
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_get_product_rating_stars$$
CREATE FUNCTION fn_get_product_rating_stars(
    p_product_id VARCHAR(64)
)
RETURNS VARCHAR(10)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_stars INT DEFAULT 5;

    SET v_stars = ROUND(fn_get_product_avg_rating(p_product_id));

    IF v_stars >= 5 THEN
        RETURN '★★★★★';
    ELSEIF v_stars = 4 THEN
        RETURN '★★★★☆';
    ELSEIF v_stars = 3 THEN
        RETURN '★★★☆☆';
    ELSEIF v_stars = 2 THEN
        RETURN '★★☆☆☆';
    ELSE
        RETURN '★☆☆☆☆';
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Function 7: fn_is_product_available
-- Checks whether a product has sufficient active inventory
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_is_product_available$$
CREATE FUNCTION fn_is_product_available(
    p_product_id VARCHAR(64),
    p_required_qty INT
)
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_count
    FROM products
    WHERE product_id = p_product_id
      AND is_deleted = 0
      AND is_active = 1
      AND stock_qty >= p_required_qty;

    RETURN IF(v_count > 0, 1, 0);
END$$

-- ---------------------------------------------------------------------
-- Function 8: fn_get_order_item_count
-- Calculates total count of physical items inside an order
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_get_order_item_count$$
CREATE FUNCTION fn_get_order_item_count(
    p_order_id VARCHAR(64)
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total_items INT DEFAULT 0;

    SELECT COALESCE(SUM(quantity), 0)
    INTO v_total_items
    FROM order_items
    WHERE order_id = p_order_id;

    RETURN v_total_items;
END$$

DELIMITER ;


-- =====================================================================
-- 3. TRIGGERS
-- =====================================================================

DELIMITER $$

-- ---------------------------------------------------------------------
-- Trigger 1: trg_products_before_insert
-- Enforces non-negative price/stock and automatically sets status
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_products_before_insert$$
CREATE TRIGGER trg_products_before_insert
BEFORE INSERT ON products
FOR EACH ROW
BEGIN
    IF NEW.price < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Product price cannot be negative.';
    END IF;

    IF NEW.stock_qty < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Product stock quantity cannot be negative.';
    END IF;

    -- Auto-adjust status based on stock
    IF NEW.stock_qty = 0 AND (NEW.status IS NULL OR NEW.status = 'ACTIVE') THEN
        SET NEW.status = 'OUT_OF_STOCK';
    ELSEIF NEW.stock_qty > 0 AND (NEW.status IS NULL OR NEW.status = 'OUT_OF_STOCK') THEN
        SET NEW.status = 'ACTIVE';
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 2: trg_products_before_update
-- Enforces price/stock integrity and updates status on stock level change
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_products_before_update$$
CREATE TRIGGER trg_products_before_update
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    IF NEW.price < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Product price cannot be negative.';
    END IF;

    IF NEW.stock_qty < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Product stock quantity cannot be negative.';
    END IF;

    -- Auto-update status when stock transitions to/from 0
    IF NEW.stock_qty = 0 AND OLD.status = 'ACTIVE' THEN
        SET NEW.status = 'OUT_OF_STOCK';
    ELSEIF NEW.stock_qty > 0 AND OLD.status = 'OUT_OF_STOCK' THEN
        SET NEW.status = 'ACTIVE';
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 3: trg_products_after_update_price_audit
-- Records price changes into audit_price_history
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_products_after_update_price_audit$$
CREATE TRIGGER trg_products_after_update_price_audit
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    IF OLD.price <> NEW.price THEN
        INSERT INTO audit_price_history (product_id, old_price, new_price, changed_by, changed_at)
        VALUES (NEW.product_id, OLD.price, NEW.price, 'SYSTEM', CURRENT_TIMESTAMP);
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 4: trg_products_after_update_stock_audit
-- Records stock adjustments into audit_inventory_log
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_products_after_update_stock_audit$$
CREATE TRIGGER trg_products_after_update_stock_audit
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    IF OLD.stock_qty <> NEW.stock_qty THEN
        INSERT INTO audit_inventory_log (
            product_id,
            old_stock,
            new_stock,
            change_qty,
            action_type,
            reason,
            changed_at
        ) VALUES (
            NEW.product_id,
            OLD.stock_qty,
            NEW.stock_qty,
            NEW.stock_qty - OLD.stock_qty,
            IF(NEW.stock_qty > OLD.stock_qty, 'STOCK_INCREASE', 'STOCK_DECREASE'),
            CONCAT('Inventory changed from ', OLD.stock_qty, ' to ', NEW.stock_qty),
            CURRENT_TIMESTAMP
        );
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 5: trg_order_items_before_insert
-- Validates quantity and ensures product has sufficient available stock
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_order_items_before_insert$$
CREATE TRIGGER trg_order_items_before_insert
BEFORE INSERT ON order_items
FOR EACH ROW
BEGIN
    DECLARE v_available_stock INT;

    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Order item quantity must be at least 1.';
    END IF;

    -- Check available stock
    SELECT stock_qty INTO v_available_stock
    FROM products
    WHERE product_id = NEW.product_id
    LIMIT 1;

    IF v_available_stock IS NOT NULL AND v_available_stock < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Inventory Error: Insufficient stock available for this product.';
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 6: trg_order_items_after_insert
-- Automatically decrements stock in products when an order item is placed
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_order_items_after_insert$$
CREATE TRIGGER trg_order_items_after_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products
    SET stock_qty = GREATEST(0, stock_qty - NEW.quantity)
    WHERE product_id = NEW.product_id;
END$$

-- ---------------------------------------------------------------------
-- Trigger 7: trg_orders_after_update_status
-- Logs status changes to audit_order_status_log & restores stock on cancellation
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_orders_after_update_status$$
CREATE TRIGGER trg_orders_after_update_status
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    -- Log status change if modified
    IF OLD.status <> NEW.status THEN
        INSERT INTO audit_order_status_log (order_id, old_status, new_status, changed_at)
        VALUES (NEW.order_id, OLD.status, NEW.status, CURRENT_TIMESTAMP);
    END IF;

    -- If order is CANCELLED, restore product quantities automatically
    IF UPPER(NEW.status) = 'CANCELLED' AND UPPER(OLD.status) <> 'CANCELLED' THEN
        UPDATE products p
        JOIN order_items oi ON p.product_id = oi.product_id
        SET p.stock_qty = p.stock_qty + oi.quantity
        WHERE oi.order_id = NEW.order_id;
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 7b: trg_reviews_before_insert
-- Ensures review rating is within 1-5 and assigns rating_stars string
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_reviews_before_insert$$
CREATE TRIGGER trg_reviews_before_insert
BEFORE INSERT ON reviews
FOR EACH ROW
BEGIN
    IF NEW.rating IS NULL OR NEW.rating > 5 THEN
        SET NEW.rating = 5;
    ELSEIF NEW.rating < 1 THEN
        SET NEW.rating = 1;
    END IF;

    IF NEW.rating = 5 THEN
        SET NEW.rating_stars = '★★★★★';
    ELSEIF NEW.rating = 4 THEN
        SET NEW.rating_stars = '★★★★☆';
    ELSEIF NEW.rating = 3 THEN
        SET NEW.rating_stars = '★★★☆☆';
    ELSEIF NEW.rating = 2 THEN
        SET NEW.rating_stars = '★★☆☆☆';
    ELSE
        SET NEW.rating_stars = '★☆☆☆☆';
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 7c: trg_reviews_before_update
-- Ensures updated review rating is within 1-5 and updates rating_stars
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_reviews_before_update$$
CREATE TRIGGER trg_reviews_before_update
BEFORE UPDATE ON reviews
FOR EACH ROW
BEGIN
    IF NEW.rating IS NULL OR NEW.rating > 5 THEN
        SET NEW.rating = 5;
    ELSEIF NEW.rating < 1 THEN
        SET NEW.rating = 1;
    END IF;

    IF NEW.rating = 5 THEN
        SET NEW.rating_stars = '★★★★★';
    ELSEIF NEW.rating = 4 THEN
        SET NEW.rating_stars = '★★★★☆';
    ELSEIF NEW.rating = 3 THEN
        SET NEW.rating_stars = '★★★☆☆';
    ELSEIF NEW.rating = 2 THEN
        SET NEW.rating_stars = '★★☆☆☆';
    ELSE
        SET NEW.rating_stars = '★☆☆☆☆';
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 8: trg_reviews_after_insert
-- Recalculates product rating score & stars when review is submitted
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_reviews_after_insert$$
CREATE TRIGGER trg_reviews_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    IF NEW.status = 'APPROVED' OR NEW.status IS NULL THEN
        UPDATE products
        SET rating = fn_get_product_avg_rating(NEW.product_id),
            rating_stars = fn_get_product_rating_stars(NEW.product_id)
        WHERE product_id = NEW.product_id;
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 9: trg_reviews_after_update
-- Recalculates product rating score & stars when review is modified
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_reviews_after_update$$
CREATE TRIGGER trg_reviews_after_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    IF OLD.rating <> NEW.rating OR OLD.status <> NEW.status THEN
        UPDATE products
        SET rating = fn_get_product_avg_rating(NEW.product_id),
            rating_stars = fn_get_product_rating_stars(NEW.product_id)
        WHERE product_id = NEW.product_id;
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Trigger 10: trg_reviews_after_delete
-- Recalculates product rating score & stars when a review is deleted
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_reviews_after_delete$$
CREATE TRIGGER trg_reviews_after_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    UPDATE products
    SET rating = fn_get_product_avg_rating(OLD.product_id),
        rating_stars = fn_get_product_rating_stars(OLD.product_id)
    WHERE product_id = OLD.product_id;
END$$

-- ---------------------------------------------------------------------
-- Trigger 11: trg_cart_items_before_insert
-- Enforces positive quantity in cart items
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_cart_items_before_insert$$
CREATE TRIGGER trg_cart_items_before_insert
BEFORE INSERT ON cart_items
FOR EACH ROW
BEGIN
    IF NEW.quantity <= 0 THEN
        SET NEW.quantity = 1;
    END IF;
END$$

DELIMITER ;


-- =====================================================================
-- 4. STORED PROCEDURES
-- =====================================================================

DELIMITER $$

-- ---------------------------------------------------------------------
-- Procedure 1: sp_place_order_from_cart
-- Atomic checkout procedure: converts user cart into a confirmed order
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_place_order_from_cart$$
CREATE PROCEDURE sp_place_order_from_cart(
    IN  p_user_id          VARCHAR(64),
    IN  p_customer_name    VARCHAR(255),
    IN  p_customer_email   VARCHAR(255),
    IN  p_customer_phone   VARCHAR(50),
    IN  p_shipping_address TEXT,
    IN  p_city             VARCHAR(100),
    IN  p_postal_code      VARCHAR(20),
    IN  p_payment_method   VARCHAR(100),
    IN  p_promo_code       VARCHAR(50),
    IN  p_delivery_fee     DOUBLE,
    OUT p_order_id         VARCHAR(64),
    OUT p_total_amount     DOUBLE,
    OUT p_status_code      INT,
    OUT p_message          VARCHAR(255)
)
proc_main: BEGIN
    DECLARE v_cart_id VARCHAR(64);
    DECLARE v_cart_count INT DEFAULT 0;
    DECLARE v_subtotal DOUBLE DEFAULT 0.0;
    DECLARE v_discount DOUBLE DEFAULT 0.0;
    DECLARE v_fee DOUBLE DEFAULT 350.0;
    DECLARE v_calculated_total DOUBLE DEFAULT 0.0;
    DECLARE v_stock_issue INT DEFAULT 0;
    DECLARE v_issue_product_name VARCHAR(255);

    -- Cursor variables
    DECLARE v_item_prod_id VARCHAR(64);
    DECLARE v_item_name VARCHAR(255);
    DECLARE v_item_price DOUBLE;
    DECLARE v_item_qty INT;
    DECLARE v_item_img TEXT;
    DECLARE v_cursor_done INT DEFAULT 0;

    -- Diagnostic variables
    DECLARE v_sqlstate CHAR(5) DEFAULT '00000';
    DECLARE v_errno INT DEFAULT 0;
    DECLARE v_msg TEXT DEFAULT '';

    -- Item cursor
    DECLARE cur_cart_items CURSOR FOR
        SELECT ci.product_id, p.product_name, p.price, ci.quantity, p.image_url
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.product_id
        WHERE ci.cart_id = v_cart_id;

    -- Cursor handler
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_cursor_done = 1;

    -- Standard error handler with diagnostic reporting
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_sqlstate = RETURNED_SQLSTATE,
            v_errno    = MYSQL_ERRNO,
            v_msg      = MESSAGE_TEXT;
        ROLLBACK;
        SET p_order_id     = NULL;
        SET p_total_amount = 0.0;
        SET p_status_code  = 99;
        SET p_message      = CONCAT('Error [', v_errno, ' / ', v_sqlstate, ']: ', v_msg);
    END;

    START TRANSACTION;

    -- 1. Locate the customer's cart
    SELECT cart_id INTO v_cart_id
    FROM carts
    WHERE user_id = p_user_id
    LIMIT 1;

    IF v_cart_id IS NULL THEN
        SET p_order_id     = NULL;
        SET p_total_amount = 0.0;
        SET p_status_code  = 1;
        SET p_message      = 'Cart not found for customer.';
        ROLLBACK;
        LEAVE proc_main;
    END IF;

    -- 2. Verify cart is not empty
    SELECT COUNT(*) INTO v_cart_count
    FROM cart_items
    WHERE cart_id = v_cart_id;

    IF v_cart_count = 0 THEN
        SET p_order_id     = NULL;
        SET p_total_amount = 0.0;
        SET p_status_code  = 1;
        SET p_message      = 'Cannot place order: Cart is empty.';
        ROLLBACK;
        LEAVE proc_main;
    END IF;

    -- 3. Check stock availability for all items in cart
    SELECT COUNT(*) INTO v_stock_issue
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    WHERE ci.cart_id = v_cart_id
      AND p.stock_qty < ci.quantity;

    IF v_stock_issue > 0 THEN
        SELECT p.product_name INTO v_issue_product_name
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.product_id
        WHERE ci.cart_id = v_cart_id
          AND p.stock_qty < ci.quantity
        LIMIT 1;

        SET p_order_id     = NULL;
        SET p_total_amount = 0.0;
        SET p_status_code  = 2;
        SET p_message      = CONCAT('Insufficient stock for item: ', IFNULL(v_issue_product_name, 'a cart item'));
        ROLLBACK;
        LEAVE proc_main;
    END IF;

    -- 4. Calculate subtotal from cart items and current product prices
    SELECT SUM(ci.quantity * p.price) INTO v_subtotal
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    WHERE ci.cart_id = v_cart_id;

    -- 5. Calculate discount using stored function
    SET v_discount = fn_calculate_discount(v_subtotal, p_promo_code);

    -- 6. Calculate total amount using stored function
    IF p_delivery_fee IS NOT NULL THEN
        SET v_fee = p_delivery_fee;
    END IF;
    SET v_calculated_total = fn_calculate_order_total(v_subtotal, v_discount, v_fee);

    -- 7. Generate a unique Order ID
    SET p_order_id = CONCAT('SS', LPAD(FLOOR(RAND() * 900000 + 100000), 6, '0'));

    -- 8. Insert record into orders table
    INSERT INTO orders (
        order_id,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        city,
        postal_code,
        order_date,
        status,
        payment_method,
        payment_status,
        subtotal,
        discount,
        promo_code,
        delivery_fee,
        total_amount,
        staff_name,
        vehicle_no,
        created_at
    ) VALUES (
        p_order_id,
        p_user_id,
        p_customer_name,
        p_customer_email,
        p_customer_phone,
        p_shipping_address,
        p_city,
        p_postal_code,
        CURRENT_TIMESTAMP,
        'PENDING',
        IFNULL(p_payment_method, 'Cash on Delivery'),
        'PENDING',
        v_subtotal,
        v_discount,
        p_promo_code,
        v_fee,
        v_calculated_total,
        'Express Courier Partner',
        'WP-CA-8842',
        CURRENT_TIMESTAMP
    );

    -- 9. Insert items into order_items via cursor
    -- Reset cursor flag to ensure clean execution
    SET v_cursor_done = 0;
    OPEN cur_cart_items;
    item_loop: LOOP
        FETCH cur_cart_items INTO v_item_prod_id, v_item_name, v_item_price, v_item_qty, v_item_img;
        IF v_cursor_done = 1 THEN
            LEAVE item_loop;
        END IF;

        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image_url)
        VALUES (p_order_id, v_item_prod_id, v_item_name, v_item_price, v_item_qty, v_item_img);
    END LOOP item_loop;
    CLOSE cur_cart_items;

    -- 10. Clear customer cart
    DELETE FROM cart_items WHERE cart_id = v_cart_id;

    COMMIT;

    SET p_total_amount = v_calculated_total;
    SET p_status_code  = 0;
    SET p_message      = 'Order placed successfully!';
END$$

-- ---------------------------------------------------------------------
-- Procedure 2: sp_cancel_order
-- Safely cancels an order and triggers stock restoration
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_cancel_order$$
CREATE PROCEDURE sp_cancel_order(
    IN  p_order_id VARCHAR(64),
    IN  p_reason   VARCHAR(255),
    OUT p_success  TINYINT(1),
    OUT p_message  VARCHAR(255)
)
BEGIN
    DECLARE v_current_status VARCHAR(50);

    -- Fetch order current status
    SELECT status INTO v_current_status
    FROM orders
    WHERE order_id = p_order_id
    LIMIT 1;

    IF v_current_status IS NULL THEN
        SET p_success = 0;
        SET p_message = 'Order not found.';
    ELSEIF UPPER(v_current_status) = 'CANCELLED' THEN
        SET p_success = 0;
        SET p_message = 'Order is already cancelled.';
    ELSEIF UPPER(v_current_status) = 'DELIVERED' THEN
        SET p_success = 0;
        SET p_message = 'Delivered orders cannot be cancelled.';
    ELSE
        -- Updating status to CANCELLED triggers trg_orders_after_update_status
        -- which automatically restores inventory stock in products table!
        UPDATE orders
        SET status = 'CANCELLED'
        WHERE order_id = p_order_id;

        SET p_success = 1;
        SET p_message = CONCAT('Order ', p_order_id, ' successfully cancelled. Stock restored.');
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Procedure 3: sp_restock_product
-- Restocks inventory and triggers inventory audit log
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_restock_product$$
CREATE PROCEDURE sp_restock_product(
    IN  p_product_id  VARCHAR(64),
    IN  p_add_qty     INT,
    OUT p_new_stock   INT,
    OUT p_status_msg  VARCHAR(255)
)
BEGIN
    DECLARE v_current_stock INT;

    IF p_add_qty <= 0 THEN
        SET p_new_stock  = 0;
        SET p_status_msg = 'Error: Restock quantity must be greater than zero.';
    ELSE
        SELECT stock_qty INTO v_current_stock
        FROM products
        WHERE product_id = p_product_id
        LIMIT 1;

        IF v_current_stock IS NULL THEN
            SET p_new_stock  = 0;
            SET p_status_msg = 'Error: Product not found.';
        ELSE
            -- Updating products fires trg_products_before_update and trg_products_after_update_stock_audit
            UPDATE products
            SET stock_qty = stock_qty + p_add_qty
            WHERE product_id = p_product_id;

            SELECT stock_qty INTO p_new_stock
            FROM products
            WHERE product_id = p_product_id;

            SET p_status_msg = CONCAT('Product restocked successfully. New stock: ', p_new_stock);
        END IF;
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Procedure 4: sp_apply_promotional_discount
-- Applies a promotional code to an existing pending order
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_apply_promotional_discount$$
CREATE PROCEDURE sp_apply_promotional_discount(
    IN  p_order_id   VARCHAR(64),
    IN  p_promo_code VARCHAR(50),
    OUT p_discount   DOUBLE,
    OUT p_new_total  DOUBLE,
    OUT p_message    VARCHAR(255)
)
BEGIN
    DECLARE v_subtotal DOUBLE;
    DECLARE v_fee DOUBLE;
    DECLARE v_status VARCHAR(50);
    DECLARE v_discount DOUBLE;
    DECLARE v_total DOUBLE;

    SELECT subtotal, delivery_fee, status
    INTO v_subtotal, v_fee, v_status
    FROM orders
    WHERE order_id = p_order_id
    LIMIT 1;

    IF v_subtotal IS NULL THEN
        SET p_discount  = 0.0;
        SET p_new_total = 0.0;
        SET p_message   = 'Order not found.';
    ELSEIF UPPER(v_status) <> 'PENDING' THEN
        SET p_discount  = 0.0;
        SET p_new_total = 0.0;
        SET p_message   = 'Promotions can only be modified for PENDING orders.';
    ELSE
        SET v_discount = fn_calculate_discount(v_subtotal, p_promo_code);
        IF v_discount <= 0.0 THEN
            SET p_discount  = 0.0;
            SET p_new_total = 0.0;
            SET p_message   = 'Promo code is invalid, expired, or minimum spend not met.';
        ELSE
            SET v_total = fn_calculate_order_total(v_subtotal, v_discount, v_fee);

            UPDATE orders
            SET promo_code   = p_promo_code,
                discount     = v_discount,
                total_amount = v_total
            WHERE order_id = p_order_id;

            SET p_discount  = v_discount;
            SET p_new_total = v_total;
            SET p_message   = CONCAT('Promotion applied: Saved Rs. ', v_discount);
        END IF;
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Procedure 5: sp_update_order_delivery
-- Assigns delivery staff/vehicle and updates shipment progress
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_update_order_delivery$$
CREATE PROCEDURE sp_update_order_delivery(
    IN  p_order_id    VARCHAR(64),
    IN  p_new_status  VARCHAR(50),
    IN  p_staff_name  VARCHAR(255),
    IN  p_vehicle_no  VARCHAR(50),
    OUT p_success     TINYINT(1),
    OUT p_message     VARCHAR(255)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists
    FROM orders
    WHERE order_id = p_order_id;

    IF v_exists = 0 THEN
        SET p_success = 0;
        SET p_message = 'Order not found.';
    ELSE
        UPDATE orders
        SET status     = IFNULL(p_new_status, status),
            staff_name = IFNULL(p_staff_name, staff_name),
            vehicle_no = IFNULL(p_vehicle_no, vehicle_no)
        WHERE order_id = p_order_id;

        SET p_success = 1;
        SET p_message = CONCAT('Order ', p_order_id, ' delivery details updated.');
    END IF;
END$$

-- ---------------------------------------------------------------------
-- Procedure 6: sp_get_customer_order_summary
-- Generates aggregate customer profile & order metrics
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_customer_order_summary$$
CREATE PROCEDURE sp_get_customer_order_summary(
    IN p_customer_id VARCHAR(64)
)
BEGIN
    SELECT
        u.user_id,
        u.name,
        u.email,
        COUNT(o.order_id) AS total_orders,
        SUM(CASE WHEN UPPER(o.status) = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_orders,
        SUM(CASE WHEN UPPER(o.status) = 'SHIPPED' THEN 1 ELSE 0 END) AS shipped_orders,
        SUM(CASE WHEN UPPER(o.status) = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders,
        SUM(CASE WHEN UPPER(o.status) = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_orders,
        fn_get_customer_total_spent(p_customer_id) AS total_spent,
        fn_get_customer_loyalty_points(p_customer_id) AS loyalty_points
    FROM users u
    LEFT JOIN orders o ON u.user_id = o.customer_id
    WHERE u.user_id = p_customer_id
    GROUP BY u.user_id, u.name, u.email;
END$$

-- ---------------------------------------------------------------------
-- Procedure 7: sp_generate_sales_report
-- Comprehensive sales and revenue performance metrics
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_generate_sales_report$$
CREATE PROCEDURE sp_generate_sales_report(
    IN p_status_filter VARCHAR(50)
)
BEGIN
    -- Result Set 1: High-level KPI summary
    SELECT
        COUNT(order_id) AS total_orders,
        COALESCE(SUM(subtotal), 0.0) AS total_gross_sales,
        COALESCE(SUM(discount), 0.0) AS total_discounts_granted,
        COALESCE(SUM(delivery_fee), 0.0) AS total_delivery_fees,
        COALESCE(SUM(total_amount), 0.0) AS total_net_revenue,
        COALESCE(ROUND(AVG(total_amount), 2), 0.0) AS average_order_value
    FROM orders
    WHERE (p_status_filter = 'ALL' OR status = p_status_filter);

    -- Result Set 2: Category sales breakdown
    SELECT
        c.category_name,
        COUNT(DISTINCT oi.order_id) AS orders_count,
        COALESCE(SUM(oi.quantity), 0) AS units_sold,
        COALESCE(ROUND(SUM(oi.price * oi.quantity), 2), 0.0) AS category_revenue
    FROM categories c
    LEFT JOIN products p ON c.category_id = p.category_id
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    GROUP BY c.category_id, c.category_name
    ORDER BY category_revenue DESC;
END$$

DELIMITER ;
