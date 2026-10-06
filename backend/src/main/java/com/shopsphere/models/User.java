package com.shopsphere.models;

public class User {
    public String user_id;
    public String name;
    public String email;
    public String password;
    public String phone;
    public String role; // ADMINISTRATOR, CUSTOMER, VENDOR, DELIVERY_STAFF
    public String shipping_address;

    public User() {}

    public User(String id, String name, String email, String password, String phone, String role) {
        this.user_id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.role = role;
    }
}
