package com.shopsphere.utils;

import com.shopsphere.models.*;
import java.util.*;

public class JsonUtil {

    public static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    public static String toJson(Product p) {
        if (p == null) return "null";
        String stars = (p.rating_stars != null && !p.rating_stars.isEmpty()) ? p.rating_stars : Product.formatStars(p.rating);
        return String.format(Locale.US,
            "{\"product_id\":\"%s\",\"product_name\":\"%s\",\"category_id\":\"%s\",\"brand_id\":\"%s\"," +
            "\"price\":%.2f,\"stock_qty\":%d,\"low_stock_threshold\":%d,\"status\":\"%s\"," +
            "\"image_url\":\"%s\",\"description\":\"%s\",\"rating\":%.1f,\"rating_stars\":\"%s\"}",
            escape(p.product_id), escape(p.product_name), escape(p.category_id), escape(p.brand_id),
            p.price, p.stock_qty, p.low_stock_threshold, escape(p.status),
            escape(p.image_url), escape(p.description), p.rating, escape(stars)
        );
    }

    public static String productsToJson(Collection<Product> list) {
        StringBuilder sb = new StringBuilder("[");
        int count = 0;
        for (Product p : list) {
            if (count++ > 0) sb.append(",");
            sb.append(toJson(p));
        }
        sb.append("]");
        return sb.toString();
    }

    public static String toJson(Category c) {
        if (c == null) return "null";
        return String.format(
            "{\"category_id\":\"%s\",\"category_name\":\"%s\",\"description\":\"%s\",\"icon\":\"%s\"}",
            escape(c.category_id), escape(c.category_name), escape(c.description), escape(c.icon)
        );
    }

    public static String categoriesToJson(Collection<Category> list) {
        StringBuilder sb = new StringBuilder("[");
        int count = 0;
        for (Category c : list) {
            if (count++ > 0) sb.append(",");
            sb.append(toJson(c));
        }
        sb.append("]");
        return sb.toString();
    }

    public static String toJson(Brand b) {
        if (b == null) return "null";
        return String.format(
            "{\"brand_id\":\"%s\",\"brand_name\":\"%s\",\"description\":\"%s\",\"origin\":\"%s\"}",
            escape(b.brand_id), escape(b.brand_name), escape(b.description), escape(b.origin)
        );
    }

    public static String brandsToJson(Collection<Brand> list) {
        StringBuilder sb = new StringBuilder("[");
        int count = 0;
        for (Brand b : list) {
            if (count++ > 0) sb.append(",");
            sb.append(toJson(b));
        }
        sb.append("]");
        return sb.toString();
    }

    public static String toJson(Promotion p) {
        if (p == null) return "null";
        return String.format(Locale.US,
            "{\"promotion_id\":\"%s\",\"promotion_code\":\"%s\",\"title\":\"%s\",\"description\":\"%s\"," +
            "\"discount_type\":\"%s\",\"discount_value\":%.2f,\"min_spend\":%.2f,\"start_date\":\"%s\",\"end_date\":\"%s\",\"status\":\"%s\"}",
            escape(p.promotion_id), escape(p.promotion_code), escape(p.title), escape(p.description),
            escape(p.discount_type), p.discount_value, p.min_spend, escape(p.start_date), escape(p.end_date), escape(p.status)
        );
    }

    public static String promotionsToJson(Collection<Promotion> list) {
        StringBuilder sb = new StringBuilder("[");
        int count = 0;
        for (Promotion p : list) {
            if (count++ > 0) sb.append(",");
            sb.append(toJson(p));
        }
        sb.append("]");
        return sb.toString();
    }

    public static String toJson(Order o) {
        if (o == null) return "null";
        StringBuilder items = new StringBuilder("[");
        if (o.order_items != null) {
            for (int i = 0; i < o.order_items.size(); i++) {
                if (i > 0) items.append(",");
                OrderItem it = o.order_items.get(i);
                items.append(String.format(Locale.US,
                    "{\"product_id\":\"%s\",\"product_name\":\"%s\",\"price\":%.2f,\"quantity\":%d,\"image_url\":\"%s\"}",
                    escape(it.product_id), escape(it.product_name), it.price, it.quantity, escape(it.image_url)
                ));
            }
        }
        items.append("]");

        return String.format(Locale.US,
            "{\"order_id\":\"%s\",\"customer_name\":\"%s\",\"customer_email\":\"%s\",\"customer_phone\":\"%s\"," +
            "\"shipping_address\":\"%s\",\"city\":\"%s\",\"order_date\":\"%s\",\"status\":\"%s\"," +
            "\"payment_method\":\"%s\",\"payment_status\":\"%s\",\"subtotal\":%.2f,\"discount\":%.2f," +
            "\"promo_code\":\"%s\",\"total_amount\":%.2f,\"staff_name\":\"%s\",\"vehicle_no\":\"%s\",\"order_items\":%s}",
            escape(o.order_id), escape(o.customer_name), escape(o.customer_email), escape(o.customer_phone),
            escape(o.shipping_address), escape(o.city), escape(o.order_date), escape(o.status),
            escape(o.payment_method), escape(o.payment_status), o.subtotal, o.discount,
            escape(o.promo_code), o.total_amount, escape(o.staff_name), escape(o.vehicle_no), items.toString()
        );
    }

    public static String ordersToJson(Collection<Order> list) {
        StringBuilder sb = new StringBuilder("[");
        int count = 0;
        for (Order o : list) {
            if (count++ > 0) sb.append(",");
            sb.append(toJson(o));
        }
        sb.append("]");
        return sb.toString();
    }

    public static String toJson(Review r) {
        if (r == null) return "null";
        String stars = (r.rating_stars != null && !r.rating_stars.isEmpty()) ? r.rating_stars : Review.formatStars(r.rating);
        return String.format(
            "{\"review_id\":\"%s\",\"product_id\":\"%s\",\"customer_name\":\"%s\",\"customer_id\":\"%s\",\"customer_email\":\"%s\",\"rating\":%d,\"rating_stars\":\"%s\",\"comment\":\"%s\",\"status\":\"%s\",\"review_date\":\"%s\"}",
            escape(r.review_id), escape(r.product_id), escape(r.customer_name),
            escape(r.customer_id != null ? r.customer_id : ""),
            escape(r.customer_email != null ? r.customer_email : ""),
            r.rating, escape(stars), escape(r.comment), escape(r.status), escape(r.review_date)
        );
    }

    public static String reviewsToJson(Collection<Review> list) {
        StringBuilder sb = new StringBuilder("[");
        int count = 0;
        for (Review r : list) {
            if (count++ > 0) sb.append(",");
            sb.append(toJson(r));
        }
        sb.append("]");
        return sb.toString();
    }

    public static String toJson(User u) {
        if (u == null) return "null";
        return String.format(
            "{\"user_id\":\"%s\",\"name\":\"%s\",\"email\":\"%s\",\"role\":\"%s\",\"phone\":\"%s\",\"shipping_address\":\"%s\"}",
            escape(u.user_id), escape(u.name), escape(u.email), escape(u.role),
            escape(u.phone), escape(u.shipping_address)
        );
    }

    public static String toJson(CartItem item) {
        if (item == null) return "null";
        String prodJson = item.product != null ? toJson(item.product) : "null";
        return String.format(Locale.US,
            "{\"item_id\":\"%s\",\"product_id\":\"%s\",\"quantity\":%d,\"product\":%s}",
            escape(item.item_id), escape(item.product_id), item.quantity, prodJson
        );
    }

    public static String toJson(Cart c) {
        if (c == null) return "null";
        StringBuilder items = new StringBuilder("[");
        if (c.cart_items != null) {
            for (int i = 0; i < c.cart_items.size(); i++) {
                if (i > 0) items.append(",");
                items.append(toJson(c.cart_items.get(i)));
            }
        }
        items.append("]");
        return String.format(
            "{\"cart_id\":\"%s\",\"user_id\":\"%s\",\"cart_items\":%s}",
            escape(c.cart_id), escape(c.user_id), items.toString()
        );
    }

    // Simple JSON value extractor
    public static String getString(String json, String key) {
        if (json == null) return null;
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx == -1) return null;
        int colon = json.indexOf(":", idx + search.length());
        if (colon == -1) return null;
        int startQuote = json.indexOf("\"", colon);
        int nextComma = json.indexOf(",", colon);
        int nextBrace = json.indexOf("}", colon);
        int endBound = (nextComma != -1 && (nextBrace == -1 || nextComma < nextBrace)) ? nextComma : nextBrace;
        if (endBound != -1) {
            String between = json.substring(colon + 1, endBound).trim();
            if ("null".equalsIgnoreCase(between) || between.isEmpty()) return null;
            if (startQuote != -1 && startQuote > endBound) return null;
        }
        if (startQuote == -1) return null;
        int endQuote = json.indexOf("\"", startQuote + 1);
        if (endQuote == -1) return null;
        return json.substring(startQuote + 1, endQuote);
    }

    public static double getDouble(String json, String key, double fallback) {
        if (json == null) return fallback;
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx == -1) return fallback;
        int colon = json.indexOf(":", idx + search.length());
        if (colon == -1) return fallback;
        int nextComma = json.indexOf(",", colon);
        int nextBrace = json.indexOf("}", colon);
        int end = (nextComma != -1 && (nextBrace == -1 || nextComma < nextBrace)) ? nextComma : nextBrace;
        if (end == -1) end = json.length();
        String valStr = json.substring(colon + 1, end).trim().replace("\"", "");
        try {
            return Double.parseDouble(valStr);
        } catch (Exception e) {
            return fallback;
        }
    }

    public static int getInt(String json, String key, int fallback) {
        return (int) getDouble(json, key, fallback);
    }

    public static boolean getBoolean(String json, String key, boolean fallback) {
        if (json == null) return fallback;
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx == -1) return fallback;
        int colon = json.indexOf(":", idx + search.length());
        if (colon == -1) return fallback;
        int nextComma = json.indexOf(",", colon);
        int nextBrace = json.indexOf("}", colon);
        int end = (nextComma != -1 && (nextBrace == -1 || nextComma < nextBrace)) ? nextComma : nextBrace;
        if (end == -1) end = json.length();
        String valStr = json.substring(colon + 1, end).trim().toLowerCase();
        if (valStr.contains("true")) return true;
        if (valStr.contains("false")) return false;
        return fallback;
    }
}
