package com.shopsphere.models;

public class Brand {
    public String brand_id;
    public String brand_name;
    public String description;
    public String origin = "International";
    public boolean is_active = true;

    public Brand() {}

    public Brand(String id, String name, String desc, String origin) {
        this.brand_id = id;
        this.brand_name = name;
        this.description = desc;
        this.origin = origin;
    }
}
