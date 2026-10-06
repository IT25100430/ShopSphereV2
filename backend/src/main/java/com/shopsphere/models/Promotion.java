package com.shopsphere.models;

public class Promotion {
    public String promotion_id;
    public String promotion_code;
    public String title;
    public String description;
    public String discount_type = "PERCENTAGE"; // PERCENTAGE or FIXED_AMOUNT
    public double discount_value = 10.0;
    public double min_spend = 0.0;
    public String start_date = "2026-01-01";
    public String end_date = "2026-12-31";
    public String status = "ACTIVE";

    public Promotion() {}

    public Promotion(String id, String code, String title, String desc, String type, double val, double min) {
        this.promotion_id = id;
        this.promotion_code = code;
        this.title = title;
        this.description = desc;
        this.discount_type = type;
        this.discount_value = val;
        this.min_spend = min;
    }
}
