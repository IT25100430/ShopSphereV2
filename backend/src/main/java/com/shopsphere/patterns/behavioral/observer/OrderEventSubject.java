package com.shopsphere.patterns.behavioral.observer;

import com.shopsphere.models.Order;
import java.util.ArrayList;
import java.util.List;

/**
 * Behavioral Design Pattern: Observer Pattern - Subject
 * Maintains a subscriber list of OrderObserver instances and broadcasts lifecycle events.
 */
public class OrderEventSubject {

    private final List<OrderObserver> observers = new ArrayList<>();

    public void attach(OrderObserver observer) {
        if (observer != null && !observers.contains(observer)) {
            observers.add(observer);
        }
    }

    public void detach(OrderObserver observer) {
        observers.remove(observer);
    }

    /**
     * Broadcasts status transitions to all registered observers.
     */
    public void notifyObservers(Order order, String previousStatus, String newStatus) {
        for (OrderObserver observer : observers) {
            try {
                observer.onOrderStatusChanged(order, previousStatus, newStatus);
            } catch (Exception e) {
                System.err.println("Error notifying observer [" + observer.getObserverName() + "]: " + e.getMessage());
            }
        }
    }

    /**
     * Factory-style helper to create a default populated subject with standard e-commerce observers.
     */
    public static OrderEventSubject createDefault() {
        OrderEventSubject subject = new OrderEventSubject();
        subject.attach(new EmailNotificationObserver());
        subject.attach(new InventoryAuditObserver());
        subject.attach(new DeliveryTrackingObserver());
        return subject;
    }
}
