const EventEmitter = require('events');
const logger = require('./logger');

class EventBus extends EventEmitter {}

const eventBus = new EventBus();

// --- Phase 9/10: Event-Driven Background Jobs ---
eventBus.on('orderPlaced', async (orderData) => {
    try {
        logger.info(`[Event] Processing orderPlaced for order ${orderData.orderId}`);
        // Simulate sending emails, push notifications, or syncing external systems asynchronously
        // Example: await sendEmail(orderData.userEmail, 'Order Confirmation');
        logger.info(`[Event] orderPlaced processed successfully for order ${orderData.orderId}`);
    } catch (error) {
        logger.error(`[Event Error] Failed processing orderPlaced for ${orderData.orderId}:`, error);
    }
});

eventBus.on('paymentCompleted', async (paymentData) => {
    try {
        logger.info(`[Event] Processing paymentCompleted for payment ${paymentData.paymentId}`);
        // Example: await updateSellerBalance(paymentData.sellerId, paymentData.amount);
        logger.info(`[Event] paymentCompleted processed successfully for payment ${paymentData.paymentId}`);
    } catch (error) {
        logger.error(`[Event Error] Failed processing paymentCompleted for ${paymentData.paymentId}:`, error);
    }
});

module.exports = eventBus;
