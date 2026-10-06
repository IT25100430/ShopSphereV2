package com.shopsphere.models;

public class Review {
    public String review_id;
    public String product_id;
    public String customer_name = "Verified Customer";
    public String customer_id;
    public String customer_email;
    public int rating = 5;
    public String rating_stars;
    public String comment;
    public String status = "APPROVED"; // PENDING, APPROVED, REJECTED
    public String review_date;

    public Review() {
        this.rating_stars = formatStars(this.rating);
    }

    public Review(String id, String prodId, String name, int rating, String comment, String status, String date) {
        this.review_id = id;
        this.product_id = prodId;
        this.customer_name = name;
        this.rating = rating;
        this.rating_stars = formatStars(rating);
        this.comment = comment;
        this.status = status;
        this.review_date = date;
    }

    public Review(String id, String prodId, String name, String custId, String email, int rating, String comment, String status, String date) {
        this.review_id = id;
        this.product_id = prodId;
        this.customer_name = name;
        this.customer_id = custId;
        this.customer_email = email;
        this.rating = rating;
        this.rating_stars = formatStars(rating);
        this.comment = comment;
        this.status = status;
        this.review_date = date;
    }

    public static String formatStars(int rating) {
        if (rating >= 5) return "★★★★★";
        if (rating == 4) return "★★★★☆";
        if (rating == 3) return "★★★☆☆";
        if (rating == 2) return "★★☆☆☆";
        return "★☆☆☆☆";
    }
}
