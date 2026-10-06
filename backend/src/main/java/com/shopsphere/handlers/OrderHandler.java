package com.shopsphere.handlers;

import com.shopsphere.models.*;
import com.shopsphere.patterns.behavioral.observer.OrderEventSubject;
import com.shopsphere.patterns.behavioral.strategy.PaymentContext;
import com.shopsphere.patterns.behavioral.strategy.PaymentResult;
import com.shopsphere.patterns.behavioral.strategy.PaymentStrategy;
import com.shopsphere.services.DatabaseStore;
import com.shopsphere.utils.CorsUtil;
import com.shopsphere.utils.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class OrderHandler implements HttpHandler {
    private final DatabaseStore store;
    private final OrderEventSubject orderEventSubject;

    public OrderHandler(DatabaseStore store) {
        this.store = (store != null) ? store : new DatabaseStore();
        this.orderEventSubject = OrderEventSubject.createDefault();
    }

    public OrderHandler() {
        this(new DatabaseStore());
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (CorsUtil.handleOptions(exchange)) return;

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        // Extract user from request (X-User-Id, token, or query)
        String userId = CartHandler.getEffectiveUserId(exchange);

        String id = null;
        if (path.startsWith("/api/orders/")) {
            id = path.substring("/api/orders/".length()).trim();
        }

        if ("GET".equalsIgnoreCase(method)) {
            if (id != null && !id.isEmpty()) {
                Order o = store.getOrder(id);
                if (o != null) {
                    CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(o));
                } else {
                    CorsUtil.sendJson(exchange, 404, "{\"error\":\"Order not found\"}");
                }
            } else {
                String json = JsonUtil.ordersToJson(store.getAllOrders());
                CorsUtil.sendJson(exchange, 200, json);
            }
        } else if ("POST".equalsIgnoreCase(method)) {
            String body = readBody(exchange);
            Order o = new Order();
            o.customer_name = JsonUtil.getString(body, "customer_name");
            o.customer_email = JsonUtil.getString(body, "customer_email");
            o.customer_phone = JsonUtil.getString(body, "customer_phone");
            o.shipping_address = JsonUtil.getString(body, "shipping_address");
            o.city = JsonUtil.getString(body, "city");
            o.payment_method = JsonUtil.getString(body, "payment_method");
            o.promo_code = JsonUtil.getString(body, "promo_code");
            o.subtotal = JsonUtil.getDouble(body, "subtotal", 0.0);
            o.discount = JsonUtil.getDouble(body, "discount", 0.0);
            o.total_amount = JsonUtil.getDouble(body, "total_amount", 0.0);

            // If customer name/email missing, use authenticated user
            User authUser = store.getUser(userId);
            if (authUser != null) {
                if (o.customer_name == null || o.customer_name.isEmpty()) o.customer_name = authUser.name;
                if (o.customer_email == null || o.customer_email.isEmpty()) o.customer_email = authUser.email;
                if (o.customer_phone == null || o.customer_phone.isEmpty()) o.customer_phone = authUser.phone;
            } else {
                if (o.customer_name == null || o.customer_name.isEmpty()) o.customer_name = "Valued Customer";
                if (o.customer_email == null || o.customer_email.isEmpty()) o.customer_email = "customer@shopsphere.com";
            }

            // If order items were not passed, pull from user's active cart
            Cart cart = store.getCart(userId);
            if (cart != null && !cart.cart_items.isEmpty()) {
                double calcSubtotal = 0;
                for (CartItem ci : cart.cart_items) {
                    if (ci.product != null) {
                        o.order_items.add(new OrderItem(ci.product_id, ci.product.product_name, ci.product.price, ci.quantity, ci.product.image_url));
                        calcSubtotal += ci.product.price * ci.quantity;
                    }
                }
                if (o.subtotal <= 0) o.subtotal = calcSubtotal;
                if (o.total_amount <= 0) o.total_amount = Math.max(0, o.subtotal - o.discount);
                store.clearCart(userId);
            }

            if (o.total_amount <= 0 && o.subtotal > 0) {
                o.total_amount = Math.max(0, o.subtotal - o.discount);
            }

            // Enforce One-Time Use policy on promo code
            if (o.promo_code != null && !o.promo_code.trim().isEmpty() && !"delivery_fee".equalsIgnoreCase(o.promo_code.trim())) {
                if (store.hasUserUsedPromotion(o.promo_code, o.customer_email, userId)) {
                    CorsUtil.sendJson(exchange, 400, "{\"error\":\"Coupon code '" + o.promo_code + "' has already been used. Promotions and offer coupons are only valid for one-time use.\"}");
                    return;
                }
            } else {
                o.promo_code = null;
            }

            // Behavioral Design Pattern: Strategy Pattern for Payment Processing
            PaymentStrategy paymentStrategy = PaymentContext.resolveStrategy(o.payment_method);
            PaymentContext paymentContext = new PaymentContext(paymentStrategy);
            PaymentResult paymentResult = paymentContext.executePayment(o, o.total_amount);
            o.payment_status = paymentResult.getTransactionStatus();

            Order created = store.addOrder(o);

            // Behavioral Design Pattern: Observer Pattern notification
            orderEventSubject.notifyObservers(created, "NEW", created.status);

            CorsUtil.sendJson(exchange, 201, JsonUtil.toJson(created));

        } else if ("PUT".equalsIgnoreCase(method) && id != null && !id.isEmpty()) {
            String body = readBody(exchange);
            String status = JsonUtil.getString(body, "status");
            String staff = JsonUtil.getString(body, "staff_name");

            Order existing = store.getOrder(id);
            String previousStatus = (existing != null && existing.status != null) ? existing.status : "PENDING";

            Order updated = store.updateOrderStatus(id, status, staff);
            if (updated != null) {
                // Behavioral Design Pattern: Observer Pattern notification on status transition
                orderEventSubject.notifyObservers(updated, previousStatus, updated.status);
                CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(updated));
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Order not found\"}");
            }
        } else if ("DELETE".equalsIgnoreCase(method) && id != null && !id.isEmpty()) {
            if (store.deleteOrder(id)) {
                CorsUtil.sendJson(exchange, 200, "{\"message\":\"Order deleted successfully\"}");
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Order not found\"}");
            }
        } else {
            CorsUtil.sendJson(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    private String readBody(HttpExchange exchange) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        }
    }
}
