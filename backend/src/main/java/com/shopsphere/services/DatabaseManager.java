package com.shopsphere.services;

import java.io.*;
import java.net.URL;
import java.sql.*;
import java.util.*;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.logging.Logger;

/**
 * DatabaseManager — manages a simple JDBC connection pool and runs schema.sql on startup.
 */
public class DatabaseManager {

    private static final Logger log = Logger.getLogger(DatabaseManager.class.getName());

    private String dbUrl;
    private String dbUser;
    private String dbPassword;
    private int poolSize;

    private BlockingQueue<Connection> pool;

    /**
     * Standard public constructor (Singleton pattern removed).
     */
    public DatabaseManager() {}

    /**
     * Initialise the connection pool and run schema.sql.
     * Called once from Main.java before the HTTP server starts.
     */
    public void init() throws Exception {
        // Load config from db.properties
        Properties props = new Properties();
        InputStream is = getClass().getClassLoader().getResourceAsStream("db.properties");
        if (is == null) {
            throw new RuntimeException("db.properties not found in classpath");
        }
        props.load(is);
        is.close();

        dbUrl      = props.getProperty("db.url",       "jdbc:mysql://localhost:3306/shopsphere?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true");
        dbUser     = props.getProperty("db.user",      "root");
        dbPassword = props.getProperty("db.password",  "");
        poolSize   = Integer.parseInt(props.getProperty("db.pool.size", "10"));

        // Load JDBC driver
        Class.forName("com.mysql.cj.jdbc.Driver");

        // Run schema (creates DB + tables + seeds data if empty)
        runSchema();

        // Build connection pool
        pool = new ArrayBlockingQueue<>(poolSize);
        for (int i = 0; i < poolSize; i++) {
            pool.offer(createConnection());
        }

        log.info("✅ DatabaseManager: pool of " + poolSize + " connections ready → " + dbUrl);
    }

    private Connection createConnection() throws SQLException {
        return DriverManager.getConnection(dbUrl, dbUser, dbPassword);
    }

    /**
     * Get a connection from the pool (blocks until one is available).
     */
    public Connection getConnection() {
        try {
            Connection conn = pool.poll();
            if (conn == null || conn.isClosed()) {
                conn = createConnection();
            }
            return conn;
        } catch (Exception e) {
            throw new RuntimeException("Failed to get DB connection", e);
        }
    }

    /**
     * Return a connection back to the pool.
     */
    public void releaseConnection(Connection conn) {
        if (conn != null) {
            try {
                if (!conn.isClosed() && pool.size() < poolSize) {
                    pool.offer(conn);
                } else {
                    conn.close();
                }
            } catch (SQLException e) {
                log.warning("Failed to release connection: " + e.getMessage());
            }
        }
    }

    /**
     * Execute schema.sql — safe to run every startup (uses CREATE TABLE IF NOT EXISTS + INSERT IGNORE).
     * Phase 1: connect without DB to run CREATE DATABASE.
     * Phase 2: connect WITH shopsphere DB to run all table/data statements.
     */
    private void runSchema() throws Exception {
        String baseUrl       = "jdbc:mysql://localhost:3306/?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&characterEncoding=UTF-8";
        String shopsphereUrl = "jdbc:mysql://localhost:3306/shopsphere?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&characterEncoding=UTF-8";

        // ── Phase 1: Create the database ──────────────
        try (Connection conn = DriverManager.getConnection(baseUrl, dbUser, dbPassword);
             Statement stmt  = conn.createStatement()) {
            stmt.execute("CREATE DATABASE IF NOT EXISTS shopsphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            log.info("✅ Database 'shopsphere' ensured.");
        }

        // ── Phase 2: Parse schema.sql line-by-line, run each statement ─
        List<String> statements = parseStatements(loadLines("schema.sql"));

        try (Connection conn = DriverManager.getConnection(shopsphereUrl, dbUser, dbPassword);
             Statement stmt  = conn.createStatement()) {
            for (String s : statements) {
                String upper = s.toUpperCase().trim();
                if (upper.startsWith("CREATE DATABASE") || upper.startsWith("USE ")) continue;
                try {
                    stmt.execute(s);
                } catch (SQLException e) {
                    if (e.getErrorCode() != 1062 && e.getErrorCode() != 1050 && e.getErrorCode() != 1060 && e.getErrorCode() != 1061) {
                        log.warning("Schema stmt [" + e.getErrorCode() + "]: " + e.getMessage());
                    }
                }
            }
        }

        log.info("✅ Schema.sql executed — all tables and seed data are ready.");

        // ── Phase 3: Run routines_and_triggers.sql ─────────────────────
        try {
            List<String> routineStatements = parseDelimitedStatements(loadLines("routines_and_triggers.sql"));
            try (Connection conn = DriverManager.getConnection(shopsphereUrl, dbUser, dbPassword);
                 Statement stmt  = conn.createStatement()) {
                for (String s : routineStatements) {
                    String upper = s.toUpperCase().trim();
                    if (upper.startsWith("USE ") || upper.startsWith("CREATE DATABASE")) continue;
                    try {
                        stmt.execute(s);
                    } catch (SQLException e) {
                        // Ignore already exists / benign warnings
                        if (e.getErrorCode() != 1050 && e.getErrorCode() != 1060 && e.getErrorCode() != 1061) {
                            log.warning("Routine stmt [" + e.getErrorCode() + "]: " + e.getMessage());
                        }
                    }
                }
            }
            log.info("✅ routines_and_triggers.sql executed — stored functions, procedures, and triggers are ready.");
        } catch (Exception e) {
            log.warning("Could not auto-run routines_and_triggers.sql: " + e.getMessage());
        }
    }

    /**
     * Parse SQL lines supporting dynamic DELIMITER statements for procedures, functions, and triggers.
     */
    private List<String> parseDelimitedStatements(List<String> lines) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        String delimiter = ";";
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("--")) continue;
            if (trimmed.toUpperCase().startsWith("DELIMITER")) {
                String[] parts = trimmed.split("\\s+");
                if (parts.length >= 2) {
                    delimiter = parts[1].trim();
                }
                continue;
            }
            current.append(line).append("\n");
            if (trimmed.endsWith(delimiter)) {
                String stmt = current.toString().trim();
                if (stmt.endsWith(delimiter)) {
                    stmt = stmt.substring(0, stmt.length() - delimiter.length()).trim();
                }
                if (!stmt.isEmpty()) result.add(stmt);
                current.setLength(0);
            }
        }
        String leftover = current.toString().trim();
        if (!leftover.isEmpty()) {
            if (leftover.endsWith(delimiter)) {
                leftover = leftover.substring(0, leftover.length() - delimiter.length()).trim();
            }
            if (!leftover.isEmpty()) result.add(leftover);
        }
        return result;
    }

    /**
     * Parse SQL lines into individual statements by accumulating lines until a ';' terminator.
     * Correctly handles multi-line CREATE TABLE, INSERT, and comment lines.
     */
    private List<String> parseStatements(List<String> lines) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("--")) continue;
            current.append(line).append("\n");
            if (trimmed.endsWith(";")) {
                String stmt = current.toString().trim();
                // Remove trailing semicolon for JDBC execute()
                if (stmt.endsWith(";")) stmt = stmt.substring(0, stmt.length() - 1).trim();
                if (!stmt.isEmpty()) result.add(stmt);
                current.setLength(0);
            }
        }
        // Any leftover without a trailing semicolon
        String leftover = current.toString().trim();
        if (!leftover.isEmpty()) {
            if (leftover.endsWith(";")) leftover = leftover.substring(0, leftover.length() - 1).trim();
            if (!leftover.isEmpty()) result.add(leftover);
        }
        return result;
    }

    private List<String> loadLines(String name) throws IOException {
        InputStream is = getClass().getClassLoader().getResourceAsStream(name);
        if (is == null) throw new IOException("Resource not found: " + name);
        List<String> lines = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                lines.add(line);
            }
        }
        return lines;
    }
}
