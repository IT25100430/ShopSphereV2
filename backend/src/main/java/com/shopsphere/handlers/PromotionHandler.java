package com.shopsphere.handlers;

import com.shopsphere.models.Promotion;
import com.shopsphere.patterns.behavioral.strategy.DiscountContext;
import com.shopsphere.patterns.behavioral.strategy.DiscountStrategy;
import com.shopsphere.services.DatabaseStore;
import com.shopsphere.utils.CorsUtil;
import com.shopsphere.utils.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public class PromotionHandler implements HttpHandler {
    private final DatabaseStore store;

    public PromotionHandler(DatabaseStore store) {
        this.store = (store != null) ? store : new DatabaseStore();
    }

    public PromotionHandler() {
        this(new DatabaseStore());
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (CorsUtil.handleOptions(exchange)) return;

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        if (path.endsWith("/validate") && "POST".equalsIgnoreCase(method)) {
            String body = readBody(exchange);
            String code = JsonUtil.getString(body, "code");
            double amount = JsonUtil.getDouble(body, "amount", 0.0);
            String email = JsonUtil.getString(body, "email");
            String userId = JsonUtil.getString(body, "user_id");

            if (userId == null || userId.isEmpty()) {
                userId = CartHandler.getEffectiveUserId(exchange);
            }

            if (code == null || code.trim().isEmpty()) {
                CorsUtil.sendJson(exchange, 400, "{\"valid\":false,\"message\":\"Code is required\"}");
                return;
            }

            Promotion p = store.getPromotionByCode(code);
            if (p == null) {
                CorsUtil.sendJson(exchange, 404, "{\"valid\":false,\"message\":\"Invalid coupon code\"}");
                return;
            }
            if (!"ACTIVE".equalsIgnoreCase(p.status)) {
                CorsUtil.sendJson(exchange, 400, "{\"valid\":false,\"message\":\"Coupon has expired or is no longer active\"}");
                return;
            }

            // Enforce One-Time Use policy per user
            if ((email != null && !email.trim().isEmpty()) || (userId != null && !userId.trim().isEmpty())) {
                if (store.hasUserUsedPromotion(code, email, userId)) {
                    CorsUtil.sendJson(exchange, 400, "{\"valid\":false,\"message\":\"This coupon has already been used. Promotions and offer coupons are only valid for one-time use.\"}");
                    return;
                }
            }

            if (p.min_spend > 0 && amount < p.min_spend) {
                CorsUtil.sendJson(exchange, 400, String.format(Locale.US, "{\"valid\":false,\"message\":\"Min spend of Rs. %.2f required\"}", p.min_spend));
                return;
            }

            // Behavioral Design Pattern: Strategy Pattern execution
            DiscountStrategy strategy = DiscountContext.resolveStrategy(p.discount_type);
            DiscountContext discountContext = new DiscountContext(strategy);
            double discount = discountContext.calculate(amount, p.discount_value, p.min_spend);

            String res = String.format(Locale.US,
                "{\"valid\":true,\"discount\":%.2f,\"promo\":%s,\"message\":\"Coupon applied!\"}",
                discount, JsonUtil.toJson(p)
            );
            CorsUtil.sendJson(exchange, 200, res);
            return;
        }

        // Extract ID if present: /api/promotions/{id}
        String id = null;
        if (path.startsWith("/api/promotions/")) {
            id = path.substring("/api/promotions/".length()).trim();
        }

        if ("GET".equalsIgnoreCase(method)) {
            if (id != null && !id.isEmpty() && !"validate".equals(id)) {
                Promotion p = store.getPromotion(id);
                if (p != null) {
                    CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(p));
                } else {
                    CorsUtil.sendJson(exchange, 404, "{\"error\":\"Promotion not found\"}");
                }
            } else {
                String json = JsonUtil.promotionsToJson(store.getAllPromotions());
                CorsUtil.sendJson(exchange, 200, json);
            }
        } else if ("POST".equalsIgnoreCase(method)) {
            String body = readBody(exchange);
            Promotion p = new Promotion();
            p.promotion_code = JsonUtil.getString(body, "promotion_code");
            p.title = JsonUtil.getString(body, "title");
            p.description = JsonUtil.getString(body, "description");
            p.discount_type = JsonUtil.getString(body, "discount_type");
            p.discount_value = JsonUtil.getDouble(body, "discount_value", 10.0);
            p.min_spend = JsonUtil.getDouble(body, "min_spend", 0.0);
            p.start_date = JsonUtil.getString(body, "start_date");
            p.end_date = JsonUtil.getString(body, "end_date");
            p.status = JsonUtil.getString(body, "status");

            if (p.promotion_code == null || p.promotion_code.isEmpty()) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Promotion code is required\"}");
                return;
            }
            Promotion created = store.addPromotion(p);
            CorsUtil.sendJson(exchange, 201, JsonUtil.toJson(created));

        } else if ("PUT".equalsIgnoreCase(method) && id != null && !id.isEmpty()) {
            String body = readBody(exchange);
            Promotion p = new Promotion();
            p.promotion_code = JsonUtil.getString(body, "promotion_code");
            p.title = JsonUtil.getString(body, "title");
            p.description = JsonUtil.getString(body, "description");
            p.discount_type = JsonUtil.getString(body, "discount_type");
            p.discount_value = JsonUtil.getDouble(body, "discount_value", -1.0);
            p.min_spend = JsonUtil.getDouble(body, "min_spend", -1.0);
            p.start_date = JsonUtil.getString(body, "start_date");
            p.end_date = JsonUtil.getString(body, "end_date");
            p.status = JsonUtil.getString(body, "status");

            Promotion updated = store.updatePromotion(id, p);
            if (updated != null) {
                CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(updated));
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Promotion not found\"}");
            }

        } else if ("DELETE".equalsIgnoreCase(method) && id != null && !id.isEmpty()) {
            if (store.deletePromotion(id)) {
                CorsUtil.sendJson(exchange, 200, "{\"message\":\"Promotion removed successfully\"}");
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Promotion not found\"}");
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
