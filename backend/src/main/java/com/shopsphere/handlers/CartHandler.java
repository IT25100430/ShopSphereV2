package com.shopsphere.handlers;

import com.shopsphere.models.Cart;
import com.shopsphere.services.DatabaseStore;
import com.shopsphere.utils.CorsUtil;
import com.shopsphere.utils.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class CartHandler implements HttpHandler {
    public static String getEffectiveUserId(HttpExchange exchange) {
        // 1. Check custom X-User-Id header
        String customUserId = exchange.getRequestHeaders().getFirst("X-User-Id");
        if (customUserId != null && !customUserId.trim().isEmpty() &&
            !"null".equalsIgnoreCase(customUserId.trim()) &&
            !"undefined".equalsIgnoreCase(customUserId.trim())) {
            return customUserId.trim();
        }

        // 2. Check query parameter ?user_id=...
        String query = exchange.getRequestURI().getQuery();
        if (query != null) {
            for (String param : query.split("&")) {
                String[] pair = param.split("=");
                if (pair.length == 2 && "user_id".equalsIgnoreCase(pair[0])) {
                    String val = pair[1].trim();
                    if (!val.isEmpty()) return val;
                }
            }
        }

        // 3. Check Authorization header
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        if (authHeader != null) {
            String token = authHeader.replace("Bearer ", "").trim();
            if (token.startsWith("mock-jwt-token-")) {
                String remainder = token.substring("mock-jwt-token-".length());
                int lastDash = remainder.lastIndexOf('-');
                if (lastDash > 0) {
                    return remainder.substring(0, lastDash);
                }
                return remainder;
            } else if (!token.isEmpty() &&
                       !"null".equalsIgnoreCase(token) &&
                       !"undefined".equalsIgnoreCase(token)) {
                return token;
            }
        }

        return "default_customer";
    }

    private final DatabaseStore store;

    public CartHandler(DatabaseStore store) {
        this.store = (store != null) ? store : new DatabaseStore();
    }

    public CartHandler() {
        this(new DatabaseStore());
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (CorsUtil.handleOptions(exchange)) return;

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        String userId = getEffectiveUserId(exchange);

        if ("GET".equalsIgnoreCase(method)) {
            Cart cart = store.getCart(userId);
            CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(cart));

        } else if ("POST".equalsIgnoreCase(method) && (path.endsWith("/items") || path.endsWith("/cart") || path.endsWith("/cart/"))) {
            String body = readBody(exchange);
            String productId = JsonUtil.getString(body, "product_id");
            if (productId == null || productId.isEmpty()) {
                productId = JsonUtil.getString(body, "id");
            }
            int qty = JsonUtil.getInt(body, "quantity", 1);
            if (qty <= 0) qty = 1;

            if (productId == null || productId.isEmpty()) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"product_id is required\"}");
                return;
            }

            Cart updated = store.addToCart(userId, productId, qty);
            CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(updated));

        } else if ("PUT".equalsIgnoreCase(method) && path.contains("/items/")) {
            String itemId = path.substring(path.lastIndexOf('/') + 1).trim();
            String body = readBody(exchange);
            int qty = JsonUtil.getInt(body, "quantity", 1);

            Cart updated = store.updateCartItem(userId, itemId, qty);
            CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(updated));

        } else if ("DELETE".equalsIgnoreCase(method) && path.contains("/items/")) {
            String itemId = path.substring(path.lastIndexOf('/') + 1).trim();
            Cart updated = store.removeCartItem(userId, itemId);
            CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(updated));

        } else if ("DELETE".equalsIgnoreCase(method)) {
            store.clearCart(userId);
            Cart empty = store.getCart(userId);
            CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(empty));

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
