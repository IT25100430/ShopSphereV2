package com.shopsphere.handlers;

import com.shopsphere.models.User;
import com.shopsphere.services.DatabaseStore;
import com.shopsphere.utils.CorsUtil;
import com.shopsphere.utils.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collection;

public class AuthHandler implements HttpHandler {
    private final DatabaseStore store;

    public AuthHandler(DatabaseStore store) {
        this.store = (store != null) ? store : new DatabaseStore();
    }

    public AuthHandler() {
        this(new DatabaseStore());
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (CorsUtil.handleOptions(exchange)) return;

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        if ("POST".equalsIgnoreCase(method) && path.endsWith("/login")) {
            String body = readBody(exchange);
            String email = JsonUtil.getString(body, "email");
            String password = JsonUtil.getString(body, "password");

            if (email == null || email.trim().isEmpty()) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Email is required\"}");
                return;
            }

            if (password == null || password.length() < 8) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Password must be at least 8 characters long\"}");
                return;
            }

            User user = store.authenticate(email, password);
            if (user == null) {
                // If user doesn't exist, create demo profile on the fly for seamless testing
                user = new User("usr-" + System.currentTimeMillis(),
                    email.split("@")[0], email, password != null ? password : "password123", "+94 77 000 0000", "CUSTOMER");
                store.addUser(user);
            }

            String token = "mock-jwt-token-" + user.user_id + "-" + System.currentTimeMillis();
            String res = String.format("{\"message\":\"Login successful\",\"token\":\"%s\",\"user\":%s}",
                token, JsonUtil.toJson(user));
            CorsUtil.sendJson(exchange, 200, res);

        } else if ("POST".equalsIgnoreCase(method) && path.endsWith("/register")) {
            String body = readBody(exchange);
            String name = JsonUtil.getString(body, "name");
            String email = JsonUtil.getString(body, "email");
            String password = JsonUtil.getString(body, "password");
            String role = JsonUtil.getString(body, "role");
            String phone = JsonUtil.getString(body, "phone");

            if (email == null || email.trim().isEmpty()) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Email is required\"}");
                return;
            }

            if (password == null || password.length() < 8) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"Password must be at least 8 characters long\"}");
                return;
            }

            if (role == null || role.trim().isEmpty()) {
                role = "CUSTOMER";
            }

            User user = store.getUserByEmail(email);
            if (user != null) {
                CorsUtil.sendJson(exchange, 400, "{\"error\":\"User with this email already exists\"}");
                return;
            }

            user = new User("usr-" + System.currentTimeMillis(),
                name != null ? name : email.split("@")[0], email, password, phone, role);
            store.addUser(user);

            String token = "mock-jwt-token-" + user.user_id + "-" + System.currentTimeMillis();
            String res = String.format("{\"message\":\"User registered successfully\",\"token\":\"%s\",\"user\":%s}",
                token, JsonUtil.toJson(user));
            CorsUtil.sendJson(exchange, 201, res);

        } else if ("GET".equalsIgnoreCase(method) && path.endsWith("/profile")) {
            // Return active user profile (defaults to customer or admin)
            String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
            User user = null;
            if (authHeader != null && authHeader.contains("mock-jwt-token-")) {
                for (User u : store.getAllUsers()) {
                    if (authHeader.contains(u.user_id)) {
                        user = u;
                        break;
                    }
                }
            }
            if (user == null) {
                user = store.getUserByEmail("admin@shopsphere.com");
            }
            if (user != null) {
                CorsUtil.sendJson(exchange, 200, JsonUtil.toJson(user));
            } else {
                CorsUtil.sendJson(exchange, 404, "{\"error\":\"User not found\"}");
            }

        } else if ("GET".equalsIgnoreCase(method) && (path.endsWith("/users") || path.endsWith("/api/users"))) {
            Collection<User> users = store.getAllUsers();
            StringBuilder sb = new StringBuilder("[");
            int count = 0;
            for (User u : users) {
                if (count++ > 0) sb.append(",");
                sb.append(JsonUtil.toJson(u));
            }
            sb.append("]");
            CorsUtil.sendJson(exchange, 200, sb.toString());

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
