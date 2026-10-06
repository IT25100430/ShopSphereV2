package com.shopsphere.patterns.behavioral.observer;

import com.shopsphere.models.Order;
import java.util.logging.Logger;

/**
 * Concrete Observer: Warehouse & Inventory Monitoring
 * Tracks order confirmations or cancellations to trigger stock audit alerts.
 */
public class InventoryAuditObserver implements OrderObserver {

    private static final Logger log = Logger.getLogger(InventoryAuditObserver.class.getName());

    @Override
    public void onOrderStatusChanged(Order order, String previousStatus, String newStatus) {
        if ("CONFIRMED".equalsIgnoreCase(newStatus) || "PROCESSING".equalsIgnoreCase(newStatus)) {
            log.info(String.format("📦 [InventoryAuditObserver] Reserved warehouse stock for Order %s with %d item lines.",
                    order.order_id, (order.order_items != null ? order.order_items.size() : 0)));
        } else if ("CANCELLED".equalsIgnoreCase(newStatus)) {
            log.warning(String.format("🔄 [InventoryAuditObserver] Order %s was CANCELLED. Triggering stock replenishment routine.",
                    order.order_id));
        }
    }

    @Override
    public String getObserverName() {
        return "WarehouseInventoryAuditObserver";
    }
}
