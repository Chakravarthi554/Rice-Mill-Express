const Notification = require('../models/Notification');
const User = require('../models/User');
const OrderStatusHistory = require('../models/OrderStatusHistory');
const Order = require('../models/Order');
const { emailQueue } = require('../jobs/queues');

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

            // 4. Send Email to Customer
            if (customer && customer.email) {
                try {
                    await emailQueue.add({
                        email: customer.email,
                        subject: `Order #${order.orderNumber || order._id.toString().slice(-6)} Update: ${order.orderStatus.toUpperCase()}`,
                        message: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                                <h2 style="color: #1e2b4a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">Order Status Updated</h2>
                                <p>Hello <strong>${customer.name || 'Customer'}</strong>,</p>
                                <p>The status of your order <strong>#${order.orderNumber || order._id}</strong> has been updated:</p>
                                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16a34a;">
                                    <p style="margin: 0; font-size: 16px;">Status: <strong style="color: #16a34a;">${order.orderStatus.toUpperCase()}</strong></p>
                                    ${notes ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #555;">Note: ${notes}</p>` : ''}
                                </div>
                                <p>We are processing your order as quickly as possible. You can track your order status in your dashboard.</p>
                                <p style="margin-top: 30px; font-size: 12px; color: #888;">Thank you for shopping with Rice Mill Express!</p>
                            </div>
                        `
                    });
                    console.log(`[NotificationService] Status email sent to customer: ${customer.email}`);
                } catch (emailErr) {
                    console.error('[NotificationService] Failed to send status email to customer:', emailErr.message);
                }
            }

            // 5. Send Email to Seller
            if (seller && seller.email) {
                try {
                    await emailQueue.add({
                        email: seller.email,
                        subject: `Order #${order.orderNumber || order._id.toString().slice(-6)} Update: ${order.orderStatus.toUpperCase()}`,
                        message: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                                <h2 style="color: #1e2b4a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">Order Status Updated</h2>
                                <p>Hello <strong>${seller.name || 'Seller'}</strong>,</p>
                                <p>The status of order <strong>#${order.orderNumber || order._id}</strong> has been updated to <strong>${order.orderStatus.toUpperCase()}</strong> by ${updatedBy?.name || 'Seller/Admin'}.</p>
                                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 15px;">New Status: <strong>${order.orderStatus.toUpperCase()}</strong></p>
                                    ${notes ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #555;">Note/Reason: ${notes}</p>` : ''}
                                </div>
                                <p>Please manage this order in your Seller Dashboard.</p>
                            </div>
                        `
                    });
                    console.log(`[NotificationService] Status email sent to seller: ${seller.email}`);
                } catch (emailErr) {
                    console.error('[NotificationService] Failed to send status email to seller:', emailErr.message);
                }
            }

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

            // Send Email to Customer
            const customer = await User.findById(order.user);
            if (customer && customer.email) {
                try {
                    await emailQueue.add({
                        email: customer.email,
                        subject: `Delivery Partner Assigned - Order #${order.orderNumber || order._id.toString().slice(-6)}`,
                        message: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                                <h2 style="color: #1e2b4a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">Delivery Partner Assigned</h2>
                                <p>Hello <strong>${customer.name || 'Customer'}</strong>,</p>
                                <p>Your order <strong>#${order.orderNumber || order._id}</strong> has been assigned to a delivery partner and is on its way!</p>
                                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16a34a;">
                                    <p style="margin: 0; font-size: 15px;">Delivery Partner: <strong>${partner.name}</strong></p>
                                    <p style="margin: 5px 0 0 0; font-size: 15px;">Contact Phone: <strong>${partner.phone || 'N/A'}</strong></p>
                                    <p style="margin: 5px 0 0 0; font-size: 15px;">Vehicle Number: <strong>${partner.vehicle_number || 'N/A'}</strong></p>
                                </div>
                                <p>You can track the live status in your Customer Dashboard.</p>
                                <p style="margin-top: 30px; font-size: 12px; color: #888;">Thank you for shopping with Rice Mill Express!</p>
                            </div>
                        `
                    });
                    console.log(`[NotificationService] Assignment email sent to customer: ${customer.email}`);
                } catch (emailErr) {
                    console.error('[NotificationService] Failed to send assignment email to customer:', emailErr.message);
                }
            }

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
