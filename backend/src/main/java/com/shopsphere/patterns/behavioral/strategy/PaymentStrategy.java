package com.shopsphere.patterns.behavioral.strategy;

import com.shopsphere.models.Order;

/**
 * Behavioral Design Pattern: Strategy Pattern
 * Encapsulates interchangeable payment gateway / settlement algorithms.
 */
public interface PaymentStrategy {

    /**
     * Executes the payment workflow for the specified order and total amount.
     *
     * @param order  The target order being settled
     * @param amount Total amount to charge
     * @return PaymentResult describing transaction state and status
     */
    PaymentResult processPayment(Order order, double amount);

    /**
     * @return Human-readable payment method name
     */
    String getPaymentMethodName();
}
