package com.shopsphere.models;

public class Product {
    public String product_id;
    public String product_name;
    public String category_id;
    public String brand_id;
    public double price;
    public int stock_qty;
    public int low_stock_threshold = 5;
    public String status = "ACTIVE";
    public boolean is_active = true;
    public boolean is_deleted = false;
    public String image_url;
    public String description;
    public double rating = 5.0;
    public String rating_stars = "★★★★★";

    public Product() {}

    public Product(String id, String name, String categoryId, String brandId, double price, int stock, String image, String desc, double rating) {
        this.product_id = id;
        this.product_name = name;
        this.category_id = categoryId;
        this.brand_id = brandId;
        this.price = price;
        this.stock_qty = stock;
        this.image_url = image;
        this.description = desc;
        this.rating = rating;
        this.rating_stars = formatStars(rating);
        this.status = stock > 0 ? "ACTIVE" : "OUT_OF_STOCK";
    }

    public Product(String id, String name, String categoryId, String brandId, double price, int stock, String image, String desc, double rating, String ratingStars) {
        this(id, name, categoryId, brandId, price, stock, image, desc, rating);
        if (ratingStars != null && !ratingStars.isEmpty()) {
            this.rating_stars = ratingStars;
        }
    }

    public static String formatStars(double rating) {
        int stars = (int) Math.round(rating);
        if (stars >= 5) return "★★★★★";
        if (stars == 4) return "★★★★☆";
        if (stars == 3) return "★★★☆☆";
        if (stars == 2) return "★★☆☆☆";
        return "★☆☆☆☆";
    }
}
