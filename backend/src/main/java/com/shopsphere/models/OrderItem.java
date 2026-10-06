package com.shopsphere.models;

public class OrderItem {
    public String product_id;
    public String product_name;
    public double price;
    public int quantity;
    public String image_url;

    public OrderItem() {}

    public OrderItem(String prodId, String name, double price, int qty, String img) {
        this.product_id = prodId;
        this.product_name = name;
        this.price = price;
        this.quantity = qty;
        this.image_url = img;
    }
}
