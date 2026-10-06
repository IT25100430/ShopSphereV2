package com.shopsphere.handlers;

import com.shopsphere.models.Category;
import com.shopsphere.services.DatabaseStore;
import com.shopsphere.utils.CorsUtil;
import com.shopsphere.utils.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class CategoryHandler implements HttpHandler {
    private final DatabaseStore store;

    public CategoryHandler(DatabaseStore store) {
        this.store = (store != null) ? store : new DatabaseStore();
    }

    public CategoryHandler() {
        this(new DatabaseStore());
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (CorsUtil.handleOptions(exchange)) return;

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        String subPath = "";
        if (path.startsWith("/api/catalog/categories/")) {
            subPath = path.substring("/api/catalog/categories/".length()).trim();
        } else if (path.startsWith("/api/categories/")) {
            subPath = path.substring("/api/categories/".length()).trim();
        }

        if ("PATCH".equalsIgnoreCase(method) && subPath.endsWith("/restore")) {
            String catId = subPath.substring(0, subPath.indexOf("/restore")).trim();
            Category restored = store.restoreCategory(catId);
            if (restored != null) {
                CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(restored));
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Category not found\"}");
            }
            return;
        }

        String id = subPath.contains("/") ? subPath.split("/")[0] : subPath;

        if ("GET".equalsIgnoreCase(method)) {
            if (!id.isEmpty()) {
                Category c = store.getCategory(id);
                if (c != null) {
                    CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(c));
                } else {
                    CorsUtil.sendJson(exchange, 404, "{\"error\":\"Category not found\"}");
                }
            } else {
                String json = JsonUtil.categoriesToJson(store.getAllCategories());
                CorsUtil.sendJson(exchange, 200, json);
            }
        } else if ("POST".equalsIgnoreCase(method)) {
            String body = readBody(exchange);
            Category c = new Category();
            c.category_name = JsonUtil.getString(body, "category_name");
            c.description = JsonUtil.getString(body, "description");
            c.icon = JsonUtil.getString(body, "icon");
            c.is_active = JsonUtil.getBoolean(body, "is_active", true);
            if (c.icon == null || c.icon.isEmpty()) c.icon = "🏷️";

            if (c.category_name == null || c.category_name.isEmpty()) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Category name is required\"}");
                return;
            }
            Category created = store.addCategory(c);
            CorsUtil.sendJson(exchange, 201, JsonUtil.toJson(created));

        } else if ("PUT".equalsIgnoreCase(method) && !id.isEmpty()) {
            String body = readBody(exchange);
            Category c = new Category();
            c.category_name = JsonUtil.getString(body, "category_name");
            c.description = JsonUtil.getString(body, "description");
            c.icon = JsonUtil.getString(body, "icon");
            c.is_active = JsonUtil.getBoolean(body, "is_active", true);
            Category updated = store.updateCategory(id, c);
            if (updated != null) {
                CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(updated));
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Category not found\"}");
            }
        } else if ("DELETE".equalsIgnoreCase(method) && !id.isEmpty()) {
            if (store.deleteCategory(id)) {
                CorsUtil.sendJson(exchange, 200, "{\"message\":\"Category deleted successfully\"}");
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Category not found\"}");
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
