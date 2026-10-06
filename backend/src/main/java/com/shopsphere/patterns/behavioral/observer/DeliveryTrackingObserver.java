package com.shopsphere.patterns.behavioral.observer;

import com.shopsphere.models.Order;
import java.util.logging.Logger;

/**
 * Concrete Observer: Logistics & Courier Dispatch
 * Listens for SHIPPED and DELIVERED events to notify courier teams.
 */
public class DeliveryTrackingObserver implements OrderObserver {

    private static final Logger log = Logger.getLogger(DeliveryTrackingObserver.class.getName());

    @Override
    public void onOrderStatusChanged(Order order, String previousStatus, String newStatus) {
        if ("SHIPPED".equalsIgnoreCase(newStatus)) {
            log.info(String.format("🚚 [DeliveryTrackingObserver] Courier assigned: %s (%s) for delivery address: %s",
                    order.staff_name, order.vehicle_no, order.shipping_address));
        } else if ("DELIVERED".equalsIgnoreCase(newStatus)) {
            log.info(String.format("🎉 [DeliveryTrackingObserver] Order %s successfully delivered to %s (%s).",
                    order.order_id, order.customer_name, order.city));
        }
    }

    @Override
    public String getObserverName() {
        return "LogisticsDeliveryTrackingObserver";
    }
}
