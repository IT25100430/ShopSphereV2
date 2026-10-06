package com.shopsphere.patterns.behavioral.observer;

import com.shopsphere.models.Order;
import java.util.logging.Logger;

/**
 * Concrete Observer: Customer Communication Channel
 * Reacts to order state changes by dispatching email updates to customer.
 */
public class EmailNotificationObserver implements OrderObserver {

    private static final Logger log = Logger.getLogger(EmailNotificationObserver.class.getName());

    @Override
    public void onOrderStatusChanged(Order order, String previousStatus, String newStatus) {
        String recipient = (order.customer_email != null) ? order.customer_email : "customer@shopsphere.com";
        log.info(String.format("📧 [EmailNotificationObserver] Dispatched email to %s: Order %s updated from [%s] to [%s]",
                recipient, order.order_id, previousStatus, newStatus));
    }

    @Override
    public String getObserverName() {
        return "CustomerEmailNotificationObserver";
    }
}
