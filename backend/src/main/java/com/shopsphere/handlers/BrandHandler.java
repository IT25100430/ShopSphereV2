package com.shopsphere.handlers;

import com.shopsphere.models.Brand;
import com.shopsphere.services.DatabaseStore;
import com.shopsphere.utils.CorsUtil;
import com.shopsphere.utils.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class BrandHandler implements HttpHandler {
    private final DatabaseStore store;

    public BrandHandler(DatabaseStore store) {
        this.store = (store != null) ? store : new DatabaseStore();
    }

    public BrandHandler() {
        this(new DatabaseStore());
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (CorsUtil.handleOptions(exchange)) return;

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        String subPath = "";
        if (path.startsWith("/api/catalog/brands/")) {
            subPath = path.substring("/api/catalog/brands/".length()).trim();
        } else if (path.startsWith("/api/brands/")) {
            subPath = path.substring("/api/brands/".length()).trim();
        }

        if ("PATCH".equalsIgnoreCase(method) && subPath.endsWith("/restore")) {
            String brandId = subPath.substring(0, subPath.indexOf("/restore")).trim();
            Brand restored = store.restoreBrand(brandId);
            if (restored != null) {
                CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(restored));
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Brand not found\"}");
            }
            return;
        }

        String id = subPath.contains("/") ? subPath.split("/")[0] : subPath;

        if ("GET".equalsIgnoreCase(method)) {
            if (!id.isEmpty()) {
                Brand b = store.getBrand(id);
                if (b != null) {
                    CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(b));
                } else {
                    CorsUtil.sendJson(exchange, 404, "{\"error\":\"Brand not found\"}");
                }
            } else {
                String json = JsonUtil.brandsToJson(store.getAllBrands());
                CorsUtil.sendJson(exchange, 200, json);
            }
        } else if ("POST".equalsIgnoreCase(method)) {
            String body = readBody(exchange);
            Brand b = new Brand();
            b.brand_name = JsonUtil.getString(body, "brand_name");
            b.description = JsonUtil.getString(body, "description");
            b.origin = JsonUtil.getString(body, "origin");
            b.is_active = JsonUtil.getBoolean(body, "is_active", true);
            if (b.origin == null || b.origin.isEmpty()) b.origin = "International";

            if (b.brand_name == null || b.brand_name.trim().isEmpty()) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Brand name is required\"}");
                return;
            }
            b.brand_name = b.brand_name.trim();
            if (store.brandNameExists(b.brand_name, null)) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Brand name must be unique. A brand with this name already exists.\"}");
                return;
            }
            Brand created = store.addBrand(b);
            if (created == null) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Failed to create brand. A brand with this name may already exist.\"}");
                return;
            }
            CorsUtil.sendJson(exchange, 201, JsonUtil.toJson(created));

        } else if ("PUT".equalsIgnoreCase(method) && !id.isEmpty()) {
            String body = readBody(exchange);
            Brand b = new Brand();
            b.brand_name = JsonUtil.getString(body, "brand_name");
            b.description = JsonUtil.getString(body, "description");
            b.origin = JsonUtil.getString(body, "origin");
            b.is_active = JsonUtil.getBoolean(body, "is_active", true);

            if (b.brand_name != null) {
                if (b.brand_name.trim().isEmpty()) {
                    CorsUtil.sendJson(exchange, 400, "{\"error\":\"Brand name cannot be empty\"}");
                    return;
                }
                b.brand_name = b.brand_name.trim();
                if (store.brandNameExists(b.brand_name, id)) {
                    CorsUtil.sendJson(exchange, 400, "{\"error\":\"Brand name must be unique. Another brand with this name already exists.\"}");
                    return;
                }
            }
            Brand updated = store.updateBrand(id, b);
            if (updated != null) {
                CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(updated));
            } else {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Failed to update brand. Ensure brand exists and brand name is unique.\"}");
            }
        } else if ("DELETE".equalsIgnoreCase(method) && !id.isEmpty()) {
            if (store.deleteBrand(id)) {
                CorsUtil.sendJson(exchange, 200, "{\"message\":\"Brand deleted successfully\"}");
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Brand not found\"}");
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
