package com.shopsphere;

import com.shopsphere.handlers.*;
import com.shopsphere.services.DatabaseManager;
import com.shopsphere.services.DatabaseStore;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class Main {
    public static final int PORT = 5000;

    public static void main(String[] args) {
        try {
            // ── 1. Initialise MySQL database manager (Singleton pattern removed) ──────────
            System.out.println("🔌 Connecting to MySQL database...");
            DatabaseManager dbManager = new DatabaseManager();
            dbManager.init();

            // Dependency Injection: Pass database store instance into handlers
            DatabaseStore store = new DatabaseStore(dbManager);

            // ── 2. Start HTTP server ──────────────────────────────────────────
            HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

            // Register REST endpoints (Injected store dependencies)
            server.createContext("/api/health",             new HealthHandler());
            server.createContext("/api/auth",               new AuthHandler(store));
            server.createContext("/api/users",              new AuthHandler(store));
            server.createContext("/api/cart",               new CartHandler(store));
            server.createContext("/api/products",           new ProductHandler(store));
            server.createContext("/api/categories",         new CategoryHandler(store));
            server.createContext("/api/catalog/categories", new CategoryHandler(store));
            server.createContext("/api/brands",             new BrandHandler(store));
            server.createContext("/api/catalog/brands",     new BrandHandler(store));
            server.createContext("/api/promotions",         new PromotionHandler(store));
            server.createContext("/api/orders",             new OrderHandler(store));
            server.createContext("/api/reviews",            new ReviewHandler(store));

            // Multi-threaded executor
            server.setExecutor(Executors.newFixedThreadPool(16));
            server.start();

            System.out.println("==================================================");
            System.out.println("☕ Shop Sphere Java REST Backend running on port " + PORT);
            System.out.println("🗄️  Database: MySQL (shopsphere)");
            System.out.println("👉 Health Check:  http://localhost:" + PORT + "/api/health");
            System.out.println("👉 Products API:  http://localhost:" + PORT + "/api/products");
            System.out.println("👉 Categories API:http://localhost:" + PORT + "/api/categories");
            System.out.println("👉 Auth API:      http://localhost:" + PORT + "/api/auth/login");
            System.out.println("👉 Cart API:      http://localhost:" + PORT + "/api/cart");
            System.out.println("👉 Orders API:    http://localhost:" + PORT + "/api/orders");
            System.out.println("==================================================");

        } catch (Exception e) {
            System.err.println("❌ Failed to start server: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
