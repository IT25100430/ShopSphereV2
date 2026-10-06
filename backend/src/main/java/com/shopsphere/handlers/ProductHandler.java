package com.shopsphere.handlers;

import com.shopsphere.models.Product;
import com.shopsphere.services.DatabaseStore;
import com.shopsphere.utils.CorsUtil;
import com.shopsphere.utils.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class ProductHandler implements HttpHandler {
    private final DatabaseStore store;

    public ProductHandler(DatabaseStore store) {
        this.store = (store != null) ? store : new DatabaseStore();
    }

    public ProductHandler() {
        this(new DatabaseStore());
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (CorsUtil.handleOptions(exchange)) return;

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        // Check if there is an ID at the end: /api/products/{id} or /api/products/{id}/stock or /api/products/{id}/restore
        String subPath = "";
        if (path.startsWith("/api/products/")) {
            subPath = path.substring("/api/products/".length()).trim();
        }

        // Subpath routes: /api/products/{id}/stock
        if ("PATCH".equalsIgnoreCase(method) && subPath.endsWith("/stock")) {
            String prodId = subPath.substring(0, subPath.indexOf("/stock")).trim();
            String body = readBody(exchange);
            int adjustment = JsonUtil.getInt(body, "adjustment", 0);

            Product updated = store.adjustStock(prodId, adjustment);
            if (updated != null) {
                CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(updated));
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Product not found\"}");
            }
            return;
        }

        // Subpath routes: /api/products/{id}/restore
        if ("PATCH".equalsIgnoreCase(method) && subPath.endsWith("/restore")) {
            String prodId = subPath.substring(0, subPath.indexOf("/restore")).trim();
            Product restored = store.restoreProduct(prodId);
            if (restored != null) {
                CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(restored));
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Product not found\"}");
            }
            return;
        }

        String id = subPath.contains("/") ? subPath.split("/")[0] : subPath;

        if ("GET".equalsIgnoreCase(method)) {
            if (!id.isEmpty()) {
                Product p = store.getProduct(id);
                if (p != null) {
                    CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(p));
                } else {
                    CorsUtil.sendJson(exchange, 404, "{\"error\":\"Product not found\"}");
                }
            } else {
                String query = exchange.getRequestURI().getQuery();
                boolean includeDeleted = query != null && query.contains("include_deleted=true");
                boolean includeInactive = query == null || !query.contains("include_inactive=false");
                String catId = null;
                if (query != null && query.contains("category_id=")) {
                    int cIdx = query.indexOf("category_id=");
                    int amp = query.indexOf('&', cIdx);
                    catId = amp == -1 ? query.substring(cIdx + 12) : query.substring(cIdx + 12, amp);
                }
                String json = JsonUtil.productsToJson(store.getAllProducts(includeDeleted, includeInactive, catId));
                CorsUtil.sendJson(exchange, 200, json);
            }
        } else if ("POST".equalsIgnoreCase(method)) {
            String body = readBody(exchange);
            Product p = new Product();
            p.product_name = JsonUtil.getString(body, "product_name");
            p.category_id = JsonUtil.getString(body, "category_id");
            p.brand_id = JsonUtil.getString(body, "brand_id");
            p.price = JsonUtil.getDouble(body, "price", 0.0);
            p.stock_qty = JsonUtil.getInt(body, "stock_qty", 10);
            p.low_stock_threshold = JsonUtil.getInt(body, "low_stock_threshold", 5);
            p.image_url = JsonUtil.getString(body, "image_url");
            p.description = JsonUtil.getString(body, "description");
            p.is_active = JsonUtil.getBoolean(body, "is_active", true);
            if (body.contains("\"rating\"")) {
                p.rating = JsonUtil.getDouble(body, "rating", 5.0);
            }
            if (body.contains("\"rating_stars\"")) {
                p.rating_stars = JsonUtil.getString(body, "rating_stars");
            }

            if (p.product_name == null || p.product_name.trim().isEmpty()) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Product name is required\"}");
                return;
            }

            if (p.price < 0) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Product price cannot be a negative number\"}");
                return;
            }

            Product created = store.addProduct(p);
            if (created == null) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Failed to create product\"}");
                return;
            }
            CorsUtil.sendJson(exchange, 201, JsonUtil.toJson(created));

        } else if ("PUT".equalsIgnoreCase(method)) {
            if (id.isEmpty()) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Product ID required\"}");
                return;
            }
            String body = readBody(exchange);
            Product p = new Product();
            p.product_name = JsonUtil.getString(body, "product_name");
            p.category_id = JsonUtil.getString(body, "category_id");
            p.brand_id = JsonUtil.getString(body, "brand_id");
            p.price = JsonUtil.getDouble(body, "price", -1.0);
            p.stock_qty = JsonUtil.getInt(body, "stock_qty", -1);
            p.low_stock_threshold = JsonUtil.getInt(body, "low_stock_threshold", -1);
            p.image_url = JsonUtil.getString(body, "image_url");
            p.description = JsonUtil.getString(body, "description");
            p.is_active = JsonUtil.getBoolean(body, "is_active", true);
            if (body.contains("\"rating\"")) {
                p.rating = JsonUtil.getDouble(body, "rating", -1.0);
            }
            if (body.contains("\"rating_stars\"")) {
                p.rating_stars = JsonUtil.getString(body, "rating_stars");
            }

            if (body.contains("\"price\"") && p.price < 0) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Product price cannot be a negative number\"}");
                return;
            }

            Product updated = store.updateProduct(id, p);
            if (updated != null) {
                CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(updated));
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Product not found\"}");
            }

        } else if ("DELETE".equalsIgnoreCase(method)) {
            if (!id.isEmpty() && store.deleteProduct(id)) {
                CorsUtil.sendJson(exchange, 200, "{\"message\":\"Product deleted successfully\"}");
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Product not found\"}");
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
