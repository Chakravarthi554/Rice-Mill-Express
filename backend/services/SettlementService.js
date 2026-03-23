const mongoose = require('mongoose');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Order = require('../models/Order');
const Razorpay = require('razorpay');

let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

class SettlementService {
    /**
     * @desc    Calculate and prepare settlement breakdown for an order
     * @param   {Object} order - The order document
     * @returns {Object} Financial breakdown
     */
    static calculateBreakdown(order) {
        const total = order.totalPrice;
        const commissionRate = order.commissionRate || 0.15;
        // ✅ FIX: Check both deliveryFee (new canonical field) and deliveryCharge (legacy)
        const deliveryFee = order.deliveryFee || order.deliveryCharge || 0;
        
        const platformCommission = Math.round(total * commissionRate);
        const deliveryPartnerEarning = deliveryFee; // Can be a fixed rate or based on distance
        const sellerEarning = total - platformCommission - deliveryPartnerEarning;
        
        return {
            platformCommission,
            deliveryPartnerEarning,
            sellerEarning,
            total
        };
    }

    /**
     * @desc    Process settlement after order delivery
     * @param   {String} orderId - The ID of the delivered order
     */
    static async processDeliverySettlement(orderId) {
        try {
            const order = await Order.findById(orderId).populate('seller user deliveryPartner');
            if (!order || order.orderStatus !== 'delivered') {
                throw new Error('Order not found or not in delivered status');
            }

            const breakdown = this.calculateBreakdown(order);
            const { platformCommission, deliveryPartnerEarning, sellerEarning } = breakdown;

            // 1. Handle Seller Settlement
            const seller = await User.findById(order.seller);
            
            order.sellerAmount = sellerEarning;
            order.commissionAmount = platformCommission;
            
            // Handle Negative Wallet Auto-Deduction
            let duesDeducted = 0;
            let currentBalance = seller.walletBalance;

            // 1. First record the full earning
            currentBalance += sellerEarning;
            await WalletTransaction.create([{
                user: seller._id,
                amount: sellerEarning,
                type: 'seller_credit',
                status: 'completed',
                description: `Payout for Order #${order._id.toString().slice(-6)} (Credit)`,
                referenceId: order._id,
                referenceType: 'Order',
                balanceAfter: currentBalance
            }]);

            // 2. If balance was negative, calculate how much was "settled"
            if (seller.walletBalance < 0) {
                duesDeducted = Math.min(sellerEarning, Math.abs(seller.walletBalance));
                console.log(`[Settlement] Auto-settled dues: ${duesDeducted} for Seller ${seller.name}`);
            }

            seller.walletBalance = currentBalance;

            // Update associated payment record
            const Payment = mongoose.model('Payment');
            await Payment.findOneAndUpdate(
                { order: order._id },
                { 
                    $set: { 
                        payoutStatus: 'completed', 
                        status: 'completed',
                        notes: duesDeducted > 0 ? `Auto-settled dues: ₹${duesDeducted}` : undefined
                    } 
                }
            );

            await seller.save();
            await order.save(); // Save sellerAmount and commissionAmount

            // 2. Handle Delivery Partner Settlement
            if (order.deliveryPartner) {
                const dpProfile = await mongoose.model('DeliveryPartner').findById(order.deliveryPartner);
                const dpUser = await User.findById(dpProfile.user);
                
                if (dpUser) {
                    dpUser.walletBalance += deliveryPartnerEarning;
                    await dpUser.save();

                    // Save DP earning to order for stats
                    order.deliveryPartnerAmount = deliveryPartnerEarning;
                    await order.save();

                    await WalletTransaction.create([{
                        user: dpUser._id,
                        amount: deliveryPartnerEarning,
                        type: 'delivery_earning',
                        status: 'completed',
                        description: `Earning for Order #${order._id.toString().slice(-6)}`,
                        referenceId: order._id,
                        referenceType: 'Order',
                        balanceAfter: dpUser.walletBalance
                    }]);
                }
            }

            // 3. Handle Admin Commission Record (Internal Ledger)
            const admin = await User.findOne({ role: 'admin' });
            if (admin) {
                admin.walletBalance += platformCommission;
                await admin.save();

                await WalletTransaction.create([{
                    user: admin._id,
                    amount: platformCommission,
                    type: 'platform_commission',
                    status: 'completed',
                    description: `Platform Commission from Order #${order._id.toString().slice(-6)}`,
                    referenceId: order._id,
                    referenceType: 'Order',
                    balanceAfter: admin.walletBalance
                }]);
            }

            console.log(`✅ Settlement processed for Order ${orderId}`);
        } catch (error) {
            console.error(`❌ Settlement failed for Order ${orderId}:`, error.message);
            throw error;
        }
    }

    /**
     * @desc    Process refund for an order (Online/Razorpay)
     * @param   {String} orderId - The ID of the order to refund
     */
    static async processRefund(orderId, reason = 'Order cancelled') {
        try {
            const order = await Order.findById(orderId).populate('user');
            if (!order || !order.isPaid || order.paymentMethod !== 'razorpay') {
                return { success: false, message: 'Refund not applicable' };
            }

            const payment = await mongoose.model('Payment').findOne({ order: orderId });
            if (!payment || !payment.razorpayPaymentId) {
                return { success: false, message: 'Razorpay payment ID missing' };
            }

            if (!razorpayInstance) {
                throw new Error('Razorpay not configured');
            }

            const refund = await razorpayInstance.payments.refund(payment.razorpayPaymentId, {
                amount: Math.round(order.totalPrice * 100),
                notes: { reason, orderId: order._id.toString() }
            });

            console.log(`✅ Razorpay Refund Processed: ${refund.id}`);
            
            order.paymentStatus = 'refunded';
            await order.save();
            
            await mongoose.model('Payment').findOneAndUpdate(
                { order: orderId },
                { $set: { status: 'refunded', notes: reason } }
            );

            return { success: true, refundId: refund.id };
        } catch (error) {
            console.error(`❌ Refund failed for Order ${orderId}:`, error.message);
            throw error;
        }
    }

    /**
     * @desc    Reverse settlement if an order is returned after delivery
     * @param   {String} orderId - The ID of the returned order
     */
    static async reverseSettlement(orderId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const order = await Order.findById(orderId).populate('seller user deliveryPartner');
            if (!order || order.orderStatus !== 'returned') {
                throw new Error('Order not found or not in returned status');
            }

            const breakdown = this.calculateBreakdown(order);
            const { platformCommission, deliveryPartnerEarning, sellerEarning } = breakdown;

            // 1. Recover from Seller
            const seller = await User.findById(order.seller).session(session);
            seller.walletBalance -= sellerEarning;
            await seller.save({ session });

            await WalletTransaction.create([{
                user: seller._id,
                amount: -sellerEarning,
                type: 'admin_adjustment',
                status: 'completed',
                description: `Settlement reversal for Returned Order #${order._id.toString().slice(-6)}`,
                referenceId: order._id,
                referenceType: 'Order',
                balanceAfter: seller.walletBalance
            }], { session });

            // 2. Recover from Delivery Partner (Optional, depending on policy)
            // Typically DP keeps their fee if delivery was attempted/completed, 
            // but for this architecture, we follow full reversal if requested.

            // 3. Adjust Admin Balance
            const admin = await User.findOne({ role: 'admin' }).session(session);
            if (admin) {
                admin.walletBalance -= platformCommission;
                await admin.save({ session });
            }

            await session.commitTransaction();
            console.log(`✅ Settlement reversed for Order ${orderId}`);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = SettlementService;
