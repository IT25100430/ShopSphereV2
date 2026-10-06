package com.shopsphere.patterns.behavioral.strategy;

/**
 * Behavioral Design Pattern: Strategy Pattern
 * Defines an algorithmic interface for calculating promotional discounts.
 */
public interface DiscountStrategy {
    /**
     * Calculates the discount amount based on order subtotal and promotion parameters.
     *
     * @param amount        The order subtotal amount
     * @param discountValue The numeric discount value (percentage or fixed amount)
     * @param minSpend      The minimum spend threshold required to qualify
     * @return Calculated discount amount in currency units
     */
    double calculateDiscount(double amount, double discountValue, double minSpend);

    /**
     * @return The canonical strategy identifier
     */
    String getStrategyName();

    /**
     * @return Human-readable description of how this strategy operates
     */
    String getDescription();
}
