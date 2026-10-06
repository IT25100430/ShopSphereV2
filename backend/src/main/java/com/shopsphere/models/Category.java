package com.shopsphere.models;

public class Category {
    public String category_id;
    public String category_name;
    public String description;
    public String icon = "🏷️";
    public boolean is_active = true;

    public Category() {}

    public Category(String id, String name, String desc, String icon) {
        this.category_id = id;
        this.category_name = name;
        this.description = desc;
        this.icon = icon;
    }
}
