package com.shopsphere.handlers;

import com.shopsphere.models.Review;
import com.shopsphere.services.DatabaseStore;
import com.shopsphere.utils.CorsUtil;
import com.shopsphere.utils.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class ReviewHandler implements HttpHandler {
    private final DatabaseStore store;

    public ReviewHandler(DatabaseStore store) {
        this.store = (store != null) ? store : new DatabaseStore();
    }

    public ReviewHandler() {
        this(new DatabaseStore());
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (CorsUtil.handleOptions(exchange)) return;

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        String id = null;
        if (path.startsWith("/api/reviews/")) {
            id = path.substring("/api/reviews/".length()).trim();
        }

        if ("GET".equalsIgnoreCase(method)) {
            String query = exchange.getRequestURI().getQuery();
            if (query != null && query.contains("product_id=")) {
                String prodId = query.split("product_id=")[1].split("&")[0];
                String json = JsonUtil.reviewsToJson(store.getProductReviews(prodId));
                CorsUtil.sendJson(exchange, 200, json);
            } else {
                String json = JsonUtil.reviewsToJson(store.getAllReviews());
                CorsUtil.sendJson(exchange, 200, json);
            }
        } else if ("POST".equalsIgnoreCase(method)) {
            String body = readBody(exchange);
            Review r = new Review();
            r.product_id = JsonUtil.getString(body, "product_id");
            r.customer_name = JsonUtil.getString(body, "customer_name");
            r.customer_id = JsonUtil.getString(body, "customer_id");
            r.customer_email = JsonUtil.getString(body, "customer_email");
            r.comment = JsonUtil.getString(body, "comment");
            r.rating = JsonUtil.getInt(body, "rating", 5);
            r.rating_stars = Review.formatStars(r.rating);
            r.status = "APPROVED";

            if (r.comment == null || r.comment.isEmpty()) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Review comment is required\"}");
                return;
            }
            Review created = store.addReview(r);
            CorsUtil.sendJson(exchange, 201, JsonUtil.toJson(created));
        } else if ("PUT".equalsIgnoreCase(method) && id != null) {
            String body = readBody(exchange);
            int rating = JsonUtil.getInt(body, "rating", 5);
            String comment = JsonUtil.getString(body, "comment");
            if (comment == null || comment.trim().isEmpty()) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Review comment is required\"}");
                return;
            }
            Review updated = store.updateReview(id, rating, comment);
            if (updated != null) {
                CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(updated));
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Review not found\"}");
            }
        } else if ("DELETE".equalsIgnoreCase(method) && id != null) {
            if (store.deleteReview(id)) {
                CorsUtil.sendJson(exchange, 200, "{\"message\":\"Review deleted\"}");
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"Review not found\"}");
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
