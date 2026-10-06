package com.shopsphere.models;

import java.util.ArrayList;
import java.util.List;

public class Order {
    public String order_id;
    public String customer_id = "usr-cust-01";
    public String customer_name;
    public String customer_email;
    public String customer_phone;
    public String shipping_address;
    public String city;
    public String postal_code;
    public String order_date;
    public String status = "PENDING"; // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    public String payment_method = "Cash on Delivery";
    public String payment_status = "PENDING";
    public double subtotal;
    public double discount = 0.0;
    public String promo_code;
    public double delivery_fee = 350.0;
    public double total_amount;
    public String staff_name = "Express Courier Partner";
    public String vehicle_no = "WP-CA-8842";
    public List<OrderItem> order_items = new ArrayList<>();

    public Order() {}
}
