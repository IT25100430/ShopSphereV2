package com.shopsphere.models;

import java.util.ArrayList;
import java.util.List;

public class Cart {
    public String cart_id;
    public String user_id;
    public List<CartItem> cart_items = new ArrayList<>();

    public Cart() {}

    public Cart(String cartId, String userId) {
        this.cart_id = cartId;
        this.user_id = userId;
    }
}
