package com.shopsphere.patterns.behavioral.observer;

import com.shopsphere.models.Order;

/**
 * Behavioral Design Pattern: Observer Pattern - Observer Interface
 * Defines the notification contract for objects monitoring order lifecycle events.
 */
public interface OrderObserver {
    /**
     * Triggered when an order's status or key properties transition.
     *
     * @param order          The order entity affected
     * @param previousStatus The previous lifecycle state (e.g. PENDING, CONFIRMED)
     * @param newStatus      The updated state (e.g. SHIPPED, DELIVERED)
     */
    void onOrderStatusChanged(Order order, String previousStatus, String newStatus);

    /**
     * @return Unique identifier for this observer
     */
    String getObserverName();
}
