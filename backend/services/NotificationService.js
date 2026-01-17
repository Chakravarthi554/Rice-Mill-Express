const Notification = require('../models/Notification');
const User = require('../models/User');
const OrderStatusHistory = require('../models/OrderStatusHistory');
const Order = require('../models/Order');

class NotificationService {
    constructor(io) {
        this.io = io;
    }

    /**
     * Send multi-channel notification for order status updates
     */
    async notifyOrderStatusUpdate(order, previousStatus, updatedBy, notes = '', req = {}) {
        try {
            const customer = await User.findById(order.user);
            const seller = await User.findById(order.seller);

            // 1. Create In-app Notification for Customer
            const notification = await Notification.create({
                user: order.user,
                type: 'ORDER_STATUS_UPDATE',
                title: 'Order Status Updated',
                message: `Your order #${order.orderNumber} status changed from ${previousStatus} to ${order.orderStatus}.`,
                relatedEntity: order._id,
                entityModel: 'Order'
            });

            // 2. Log to OrderStatusHistory
            await OrderStatusHistory.create({
                orderId: order._id,
                previousStatus,
                newStatus: order.orderStatus,
                updatedBy: updatedBy._id,
                notes,
                ipAddress: req.ip || '0.0.0.0',
                userAgent: req.headers ? req.headers['user-agent'] : 'unknown',
                notificationsSent: true
            });

            // 3. Emit Real-time Socket Event
            if (this.io) {
                // To Customer
                this.io.to(`user_${order.user}`).emit('ORDER_UPDATE', {
                    orderId: order._id,
                    status: order.orderStatus,
                    orderNumber: order.orderNumber,
                    notification
                });

                // To Seller
                this.io.to(`user_${order.seller}`).emit('ORDER_UPDATE', {
                    orderId: order._id,
                    status: order.orderStatus,
                    orderNumber: order.orderNumber
                });

                // To Global Admin/Dashboard sync
                this.io.emit('DASHBOARD_SYNC', {
                    type: 'ORDER_UPDATE',
                    orderId: order._id,
                    status: order.orderStatus
                });
            }

            // 4. Send Email/SMS (Mocked for now - can be expanded with Twilio/SendGrid)
            console.log(`[NotificationService] Emails/SMS sent to ${customer.email} for order ${order.orderNumber}`);

            return true;
        } catch (error) {
            console.error('[NotificationService] Error:', error);
            return false;
        }
    }

    /**
     * Send notification for delivery partner assignment
     */
    async notifyPartnerAssignment(order, partner, updatedBy) {
        try {
            // Notify Customer
            const customerNotification = await Notification.create({
                user: order.user,
                type: 'ORDER_PARTNER_ASSIGNED',
                title: 'Delivery Partner Assigned',
                message: `Your order #${order.orderNumber} has been assigned to ${partner.name}.`,
                relatedEntity: order._id,
                entityModel: 'Order'
            });

            // Notify Partner (if they have a user account)
            // In this system, delivery partners are linked via partnerId, we might need a separate login for them

            if (this.io) {
                this.io.to(`user_${order.user}`).emit('ORDER_UPDATE', {
                    orderId: order._id,
                    type: 'PARTNER_ASSIGNED',
                    partner: {
                        name: partner.name,
                        phone: partner.phone,
                        vehicle: partner.vehicle_number
                    },
                    notification: customerNotification
                });
            }

            return true;
        } catch (error) {
            console.error('[NotificationService] Assignment Error:', error);
            return false;
        }
    }
}

module.exports = NotificationService;
