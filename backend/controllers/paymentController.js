const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Payout = require('../models/payoutModel');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { emitOrderUpdate } = require('../utils/socketNotifications');

// --- Razorpay Instance Setup ---
let razorpayInstance = null;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay instance initialized.');
} else {
  console.warn('⚠️ Razorpay KEY_ID or KEY_SECRET missing. Razorpay API disabled.');
}
// --- End Razorpay Setup ---

/**
 * @desc    Create a Razorpay Order ID for payment initiation (API Route Handler)
 * @route   POST /api/payments/razorpay/order
 * @access  Private (Customer)
 */
const createRazorpayOrder = asyncHandler(async (req, res) => {
  if (!razorpayInstance) {
    return res.status(503).json({ message: 'Online payments are currently unavailable.' });
  }
  const { amount, currency = 'INR', receipt } = req.body;

  if (!amount || amount <= 0 || !receipt) {
    res.status(400);
    throw new Error('Missing or invalid amount or receipt ID');
  }
  
  const finalReceipt = receipt.length > 40 ? receipt.slice(0, 40) : receipt;

  try {
    const options = {
      amount: Math.round(amount),
      currency,
      receipt: finalReceipt,
    };
    const order = await razorpayInstance.orders.create(options);
    if (!order) {
        throw new Error('Failed to create Razorpay order');
    }
    console.log("Razorpay Order Created (API):", order);
    
    res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
    });
  } catch (error) {
     console.error('Razorpay order creation error (API Route):', error);
     const errorMessage = error.error?.description || error.message || 'Failed to create Razorpay order';
     const statusCode = error.statusCode || 500;
     res.status(statusCode).json({ message: errorMessage });
  }
});

/**
 * @desc    Verify Razorpay payment
 * @route   POST /api/payments/verify
 * @access  Private (Customer/System)
 */
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400); 
        throw new Error('Missing required payment verification fields');
    }
    if (!RAZORPAY_KEY_SECRET) {
        console.error("Razorpay secret key is missing for verification.");
        res.status(500); 
        throw new Error("Payment verification configuration error.");
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex');
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        console.log(`(Verify Route) Payment Signature Verified: OID=${razorpay_order_id}, PID=${razorpay_payment_id}`);
        
        try {
            const paymentDetails = await razorpayInstance.payments.fetch(razorpay_payment_id);
            if (paymentDetails.status === 'captured') {
                 console.log(`(Verify Route) Payment ${razorpay_payment_id} status confirmed as 'captured'.`);
                 
                 const orders = await Order.find({ razorpayOrderId: razorpay_order_id, isPaid: false });
                 if(orders.length > 0) {
                     console.log(`(Verify Route) Found ${orders.length} unpaid orders associated.`);
                 }
                 
                res.json({ 
                    success: true, 
                    message: "Payment verified successfully", 
                    payment_id: razorpay_payment_id, 
                    status: paymentDetails.status 
                });
            } else {
                 console.warn(`(Verify Route) Payment ${razorpay_payment_id} status is ${paymentDetails.status}.`);
                 res.status(400).json({ 
                     success: false, 
                     message: `Payment status is ${paymentDetails.status}`, 
                     payment_id: razorpay_payment_id, 
                     status: paymentDetails.status 
                 });
            }
        } catch (fetchError) {
             console.error("(Verify Route) Error fetching payment details from Razorpay:", fetchError);
             res.status(500).json({ success: false, message: "Could not confirm payment status with Razorpay." });
        }
    } else {
        console.error(`(Verify Route) Payment Verification Failed: Invalid signature. OID=${razorpay_order_id}`);
        res.status(400).json({ success: false, message: 'Payment verification failed: Invalid signature' });
    }
});

/**
 * @desc    Handle Razorpay Webhooks
 * @route   POST /api/payments/webhook
 * @access  Public
 */
const handleRazorpayWebhook = asyncHandler(async (req, res) => {
     if (!RAZORPAY_WEBHOOK_SECRET) { 
         console.error("Webhook secret missing."); 
         return res.status(500).send('Webhook config error.'); 
     }
     
    const signature = req.headers['x-razorpay-signature'];
    const body = req.rawBody;
    
    if (!signature || !body) { 
        console.error("Webhook Error: Missing signature or body."); 
        return res.status(400).send('Invalid request'); 
    }

    try {
        const expectedSignature = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
        if (expectedSignature === signature) {
            const event = JSON.parse(body.toString());
            console.log('Webhook Received:', event.event, event.payload?.payment?.entity?.order_id || event.payload?.refund?.entity?.payment_id);

            // --- Payment Captured Event ---
            if (event.event === 'payment.captured') {
                const paymentEntity = event.payload.payment.entity;
                const razorpayOrderId = paymentEntity.order_id;
                const razorpayPaymentId = paymentEntity.id;
                
                const orders = await Order.find({ razorpayOrderId: razorpayOrderId, isPaid: false });

                if (orders.length > 0) {
                     console.log(`Webhook: Processing payment.captured for RZP OID: ${razorpayOrderId}. Found ${orders.length} unpaid orders.`);
                     
                    for(const order of orders) {
                        // Find or Create Payment Record
                        let payment = await Payment.findOneAndUpdate(
                            { order: order._id, razorpayOrderId: razorpayOrderId },
                            { $set: {
                                status: 'completed',
                                razorpayPaymentId: razorpayPaymentId,
                                notes: (payment?.notes || '') + `\nWebhook: Payment captured.`,
                                user: order.user,
                                seller: order.seller,
                                amount: order.totalPrice,
                                currency: 'INR',
                                method: 'razorpay',
                                commissionAmount: order.commissionAmount,
                                sellerPayoutAmount: order.sellerEarnings,
                                payoutStatus: 'pending',
                              }
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                        console.log(`Webhook: Payment record ${payment._id} updated/created.`);

                        // Update Order
                        order.isPaid = true;
                        order.paidAt = new Date(paymentEntity.created_at * 1000);
                        order.paymentStatus = 'completed';
                        order.paymentResult = { 
                            id: razorpayPaymentId, 
                            status: 'completed', 
                            update_time: new Date(), 
                            email_address: paymentEntity.email 
                        };
                        await order.save();
                        console.log(`Webhook: Order ${order._id} updated to paid.`);

                        // Notify Seller
                        await Notification.create({
                            user: order.seller, 
                            type: 'PAYMENT_STATUS',
                            message: `Payment received via webhook for order #${order._id.toString().slice(-6)}.`,
                            relatedEntity: order._id, 
                            entityModel: 'Order'
                        });
                        
                        // Emit Socket events
                        const io = req.app.get('io');
                        if (io) {
                             const updateDataEmit = { 
                                 status: order.orderStatus, 
                                 isPaid: true, 
                                 paymentStatus: 'completed' 
                             };
                             emitOrderUpdate(io, order.user.toString(), order._id, updateDataEmit);
                             emitOrderUpdate(io, order.seller.toString(), order._id, updateDataEmit);
                             io.to('admin').emit('ORDER_UPDATE', { 
                                 type: 'ORDER_UPDATE', 
                                 data: { orderId: order._id, ...updateDataEmit } 
                             });
                        }
                    }
                } else {
                     const existingPaidOrders = await Order.find({ razorpayOrderId: razorpayOrderId, isPaid: true });
                     if (existingPaidOrders.length > 0) {
                        console.log(`Webhook: payment.captured ignored (Order ${razorpayOrderId} already marked as paid).`);
                     } else {
                        console.warn(`Webhook: payment.captured received for unknown or already processed Razorpay Order ID: ${razorpayOrderId}`);
                     }
                }
            
            // --- Refund Processed Event ---
            } else if (event.event === 'refund.processed') {
                const refundEntity = event.payload.refund.entity;
                const paymentId = refundEntity.payment_id;
                console.log(`Webhook: Processing refund.processed for RZP PID: ${paymentId}. Amount: ${refundEntity.amount / 100}`);
                
                const paymentRecords = await Payment.find({ razorpayPaymentId: paymentId });
                if (paymentRecords.length > 0) {
                    for (const paymentRecord of paymentRecords) {
                         const order = await Order.findById(paymentRecord.order);
                         const refundStatus = (refundEntity.amount === Math.round(paymentRecord.amount * 100)) ? 'refunded' : 'partially_refunded';
                         
                         paymentRecord.status = refundStatus;
                         paymentRecord.notes = (paymentRecord.notes || '') + `\nWebhook: Refund ${refundEntity.id} processed. Amount: ${refundEntity.amount / 100} ${refundEntity.currency}`;
                         await paymentRecord.save();
                         
                         if(order) {
                            order.paymentStatus = refundStatus;
                            await order.save();
                         }
                         console.log(`Webhook: Payment ${paymentRecord._id} status updated to ${refundStatus}.`);
                    }
                } else {
                     console.warn(`Webhook: Received refund.processed for unknown Razorpay Payment ID: ${paymentId}`);
                }
            
            // --- Payment Failed Event ---
            } else if (event.event === 'payment.failed') {
                const paymentEntity = event.payload.payment.entity;
                const razorpayOrderId = paymentEntity.order_id;
                console.warn(`Webhook: Payment failed for Razorpay Order ID: ${razorpayOrderId}. Reason: ${paymentEntity.error_description}`);
                
                await Payment.updateMany(
                    { razorpayOrderId: razorpayOrderId, status: 'pending' },
                    { $set: { 
                        status: 'failed', 
                        notes: `Webhook: Payment failed - ${paymentEntity.error_description || paymentEntity.error_reason}` 
                    } }
                );
                
                await Order.updateMany(
                    { razorpayOrderId: razorpayOrderId, paymentStatus: 'pending' }, 
                    { $set: { paymentStatus: 'failed' } }
                );
                
                const orders = await Order.find({ razorpayOrderId: razorpayOrderId }).select('user');
                if (orders.length > 0) {
                    await Notification.create({ 
                        user: orders[0].user, 
                        type: 'PAYMENT_STATUS', 
                        message: `Payment failed for order associated with ${razorpayOrderId}. Reason: ${paymentEntity.error_description}` 
                    });
                }
            }

            res.status(200).json({ status: 'ok' });
        } else {
            console.error("Webhook Error: Invalid signature.");
            res.status(400).send('Invalid signature');
        }
    } catch (error) {
        console.error("Webhook Processing Error:", error);
        res.status(500).send('Webhook processing error');
    }
});

/**
 * @desc    Record COD payment received
 * @route   POST /api/payments/cod-report/:orderId
 * @access  Private (Seller)
 */
const recordCodPayment = asyncHandler(async (req, res) => {
    const orderId = req.params.orderId;
    const { amountReceived, proof } = req.body;
    const order = await Order.findById(orderId);
    
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (order.seller.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
    if (order.paymentMethod !== 'cod') { res.status(400); throw new Error('Not a COD order'); }
    if (order.paymentStatus === 'completed') { res.status(400); throw new Error('COD already recorded'); }

    // Find or Create Payment record
    let payment = await Payment.findOneAndUpdate(
        { order: order._id, method: 'cod' },
        { $set: {
            status: 'completed',
            notes: `COD received. Proof: ${proof || 'Seller confirmed'}`,
            user: order.user,
            seller: order.seller,
            amount: order.totalPrice,
            currency: 'INR',
            commissionAmount: order.commissionAmount,
            sellerPayoutAmount: order.sellerEarnings,
            payoutStatus: 'pending',
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update Order
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentStatus = 'completed';
    await order.save();

    console.log(`COD recorded for order ${orderId}. Payment record: ${payment._id}`);
    
    // Emit sockets
    const io = req.app.get('io');
    if (io) {
        const updateDataEmit = { 
            status: order.orderStatus, 
            isPaid: true, 
            paymentStatus: 'completed' 
        };
        emitOrderUpdate(io, order.user.toString(), order._id, updateDataEmit);
        emitOrderUpdate(io, order.seller.toString(), order._id, updateDataEmit);
        io.to('admin').emit('ORDER_UPDATE', { 
            type: 'ORDER_UPDATE', 
            data: { orderId: order._id, ...updateDataEmit } 
        });
        io.to(`seller_${order.seller.toString()}`).emit('REFRESH_ANALYTICS', { 
            sellerId: order.seller.toString() 
        });
    }
    
    res.status(200).json({ message: 'COD payment recorded', payment });
});

/**
 * @desc    Request a payout
 * @route   POST /api/payments/request-payout
 * @access  Private (Seller)
 */
const requestPayout = asyncHandler(async (req, res) => {
     const { amount } = req.body;
    const sellerId = req.user._id;
    
    if (!amount || amount <= 0) { 
        res.status(400); 
        throw new Error('Invalid amount'); 
    }
    
    try {
        // Recalculate available balance server-side
        const earnings = await Payment.aggregate([
            { $match: { seller: sellerId, status: 'completed' } }, 
            { $group: { _id: null, total: { $sum: '$sellerPayoutAmount' } } } 
        ]);
        
        const paidOut = await Payout.aggregate([
            { $match: { seller: sellerId, status: { $in: ['pending', 'processing', 'completed'] } } }, 
            { $group: { _id: null, total: { $sum: '$amount' } } } 
        ]);
        
        const totalEarnings = earnings[0]?.total || 0;
        const totalPaidOrPending = paidOut[0]?.total || 0;
        const availableBalance = Math.max(0, totalEarnings - totalPaidOrPending);

        if (amount > availableBalance) { 
            res.status(400); 
            throw new Error(`Requested ₹${amount.toFixed(2)} exceeds available ₹${availableBalance.toFixed(2)}`); 
        }

        // Get seller bank details
        const seller = await User.findById(sellerId).select('name email businessDetails.bankAccount');
        const bankDetails = seller?.businessDetails?.bankAccount;

        if (!bankDetails?.accountNumber || !bankDetails?.ifscCode || !bankDetails?.accountHolderName) {
            res.status(400); 
            throw new Error('Bank details incomplete. Please update profile.');
        }

        // Create Payout record
        const payout = new Payout({
            seller: sellerId, 
            amount, 
            status: 'pending', 
            currency: 'INR',
            bankDetailsSnapshot: {
                accountHolderName: bankDetails.accountHolderName,
                accountNumber: bankDetails.accountNumber,
                ifsc: bankDetails.ifscCode,
            }
        });
        const createdPayout = await payout.save();

        // Notify Admin about the new payout request
        await Notification.create({
            user: process.env.ADMIN_USER_ID,
            type: 'SYSTEM',
            message: `New payout of ₹${amount.toFixed(2)} requested by ${seller.name || seller.email}.`,
            relatedEntity: createdPayout._id,
            entityModel: 'Payout'
        });

        res.status(201).json({ message: 'Payout requested', payout: createdPayout });
    } catch (error) { 
        console.error("Payout request error:", error); 
        res.status(error.statusCode || 500).json({ 
            message: error.message || 'Failed payout request' 
        }); 
    }
});

/**
 * @desc    Get seller payment summary and history
 * @route   GET /api/payments/seller
 * @access  Private (Seller)
 */
const getSellerPayments = asyncHandler(async (req, res) => {
     const sellerId = req.user._id;
    try {
        // Fetch recent payment transactions
        const payments = await Payment.find({ seller: sellerId })
            .populate({ path: 'order', select: '_id user createdAt totalPrice' })
            .populate({ path: 'user', select: 'name email' })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Calculate Balances using Aggregation
        const balanceCalc = await Payment.aggregate([
          { $match: { seller: sellerId } },
          { $group: {
              _id: null,
              totalCompletedSellerAmount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$sellerPayoutAmount', 0] } },
            }
          }
        ]);
        
        // Calculate Payouts using Aggregation
         const payoutCalc = await Payout.aggregate([
           { $match: { seller: sellerId } },
           { $group: {
               _id: null,
               totalPaidOrPending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'processing', 'completed']] }, '$amount', 0] } },
               pendingPayouts: { $sum: { $cond: [{ $in: ['$status', ['pending', 'processing']] }, '$amount', 0] } }
             }
           }
         ]);

        const totalEarnings = balanceCalc[0]?.totalCompletedSellerAmount || 0;
        const totalPaidOrPending = payoutCalc[0]?.totalPaidOrPending || 0;
        const pendingPayoutsTotal = payoutCalc[0]?.pendingPayouts || 0;
        const availableBalance = Math.max(0, totalEarnings - totalPaidOrPending);

        // Fetch recent payout history
         const payoutHistory = await Payout.find({ seller: sellerId })
             .sort({ createdAt: -1 })
             .limit(20)
             .lean();

         // Find pending COD orders for the seller dashboard UI
         const codOrders = await Order.find({
                seller: sellerId,
                paymentMethod: 'cod',
                paymentStatus: 'pending',
                orderStatus: { $nin: ['cancelled', 'delivered'] }
            })
            .select('_id totalPrice createdAt user')
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            payments: payments || [],
            balance: {
                totalEarnings,
                availableBalance,
                pendingPayouts: pendingPayoutsTotal,
            },
            payoutHistory: payoutHistory || [],
            codOrders: codOrders || [],
        });
    } catch (error) {
        console.error("Get Seller Payments Error:", error);
        res.status(500).json({ 
            message: 'Failed to fetch payment data', 
            error: error.message 
        });
    }
});

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  recordCodPayment,
  requestPayout,
  getSellerPayments,
};