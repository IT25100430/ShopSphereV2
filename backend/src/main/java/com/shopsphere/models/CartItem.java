package com.shopsphere.models;

public class CartItem {
    public String item_id;
    public String product_id;
    public int quantity;
    public Product product;

    public CartItem() {}

    public CartItem(String itemId, String productId, int quantity, Product product) {
        this.item_id = itemId;
        this.product_id = productId;
        this.quantity = quantity;
        this.product = product;
    }
}
