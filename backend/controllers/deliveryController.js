const DeliveryPartner = require('../models/deliveryPartner.js');
const Order = require('../models/Order.js');
const asyncHandler = require('../middleware/asyncHandler.js');
const User = require('../models/User.js');
const SettlementService = require('../services/SettlementService');
const { Incentive, DPIncentiveProgress } = require('../models/Incentive.js');
const WalletTransaction = require('../models/WalletTransaction.js');

/**
 * Helper to calculate period boundaries for incentives
 */
const getPeriodBoundaries = (period) => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    
    if (period === 'daily') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    }
    return { start, end };
};

/**
 * Helper to evaluate incentives after a successful delivery
 */
const evaluateIncentives = async (deliveryPartnerId) => {
    try {
        const activeIncentives = await Incentive.find({ isActive: true });
        if (activeIncentives.length === 0) return;
        
        const dp = await DeliveryPartner.findById(deliveryPartnerId).populate('user');
        if (!dp || !dp.user) return;
        
        for (const incentive of activeIncentives) {
            const { start, end } = getPeriodBoundaries(incentive.period);
            
            // Find or create progress tracking record
            let progress = await DPIncentiveProgress.findOne({
                deliveryPartner: deliveryPartnerId,
                incentive: incentive._id,
                periodStart: start
            });
            
            if (!progress) {
                progress = new DPIncentiveProgress({
                    deliveryPartner: deliveryPartnerId,
                    incentive: incentive._id,
                    periodStart: start,
                    periodEnd: end,
                    currentCount: 0,
                    isAchieved: false
                });
            }
            
            // If already achieved, skip
            if (progress.isAchieved) continue;
            
            // Increment count
            progress.currentCount += 1;
            
            // Check achievement
            if (progress.currentCount >= incentive.target) {
                progress.isAchieved = true;
                progress.achievedAt = new Date();
                
                // Credit the bonus to user wallet
                const user = await User.findById(dp.user._id);
                if (user) {
                    user.walletBalance = (user.walletBalance || 0) + incentive.bonusAmount;
                    await user.save();
                    
                    await WalletTransaction.create({
                        user: user._id,
                        amount: incentive.bonusAmount,
                        type: 'incentive_bonus',
                        status: 'completed',
                        description: `Bonus for completing ${incentive.title}`,
                        referenceType: 'DeliveryPartner',
                        referenceId: dp._id
                    });
                    
                    console.log(`✅ Paid incentive ₹${incentive.bonusAmount} to DP ${dp._id} for ${incentive.title}`);
                }
            }
            await progress.save();
        }
    } catch (err) {
        console.error('⚠️ Failed to evaluate incentives:', err.message);
    }
};

// @desc    Get all delivery partners for the current seller
// @route   GET /api/delivery-partners/partners
// @access  Private/Seller
const getDeliveryPartners = asyncHandler(async (req, res) => {
  console.log('🔍 Fetching delivery partners for seller:', req.user._id);

  // ✅ FIXED: Only return approved partners for order assignment
  const partners = await DeliveryPartner.find({
    seller: req.user._id,
    kycStatus: 'approved' // Only show approved partners
  }).populate('user', 'name email phone');

  console.log('📦 Found approved partners:', {
    count: partners.length,
    partners: partners.map(p => ({
      id: p._id,
      name: p.name,
      kycStatus: p.kycStatus,
      seller: p.seller
    }))
  });

  res.json(partners);
});

// @desc    Create a delivery partner for the current seller
// @route   POST /api/delivery-partners/partners
// @access  Private/Seller

const createDeliveryPartner = asyncHandler(async (req, res) => {
  const { name, email, phone, password, vehicle_type, vehicle_number, license_number } = req.body;

  // Validate required fields
  if (!name || !vehicle_type || !vehicle_number || !license_number) {
    res.status(400);
    throw new Error('Name, vehicle_type, vehicle_number, and license_number are required');
  }

  // Require either phone OR (email + password)
  const hasPhoneAuth = phone && phone.trim();
  const hasEmailAuth = email && email.trim() && password && password.trim();

  if (!hasPhoneAuth && !hasEmailAuth) {
    res.status(400);
    throw new Error('Please provide either phone number OR both email and password for login credentials');
  }

  // Normalize phone number to 10 digits (remove +91 or country code if present)
  let normalizedPhone = '';
  if (hasPhoneAuth) {
    normalizedPhone = phone.replace(/^\+91/, '').replace(/^\+/, '').replace(/\D/g, '');
    if (normalizedPhone.length > 10) {
      normalizedPhone = normalizedPhone.slice(-10); // Take last 10 digits
    }
  }

  // 1. Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      email ? { email } : null,
      normalizedPhone ? { phone: normalizedPhone } : null
    ].filter(Boolean)
  });

  if (existingUser) {
    res.status(400);
    throw new Error('User with this email or phone already exists');
  }

  // 2. Create the User login identity first
  const userData = {
    name,
    role: 'deliveryPartner',
    isVerified: false, // Will be set to true when admin approves KYC
    emailVerified: false // Will be set to true when admin approves KYC
  };

  // Add credentials based on what was provided
  if (hasEmailAuth && hasPhoneAuth) {
    // Both email and phone provided
    userData.email = email;
    userData.password = password;
    userData.phone = normalizedPhone;
  } else if (hasEmailAuth) {
    // Email-only authentication
    userData.email = email;
    userData.password = password;
  } else if (hasPhoneAuth) {
    // Phone-only authentication (OTP login)
    // Generate random password and temp email to satisfy User model requirements
    const crypto = require('crypto');
    userData.phone = normalizedPhone;
    userData.email = `${normalizedPhone}@delivery.temp`;
    userData.password = crypto.randomBytes(16).toString('hex');
  }

  const user = await User.create(userData);

  if (!user) {
    res.status(500);
    throw new Error('Failed to create user account for delivery partner');
  }

  console.log('✅ User created in MongoDB:', user._id);

  // ✅ CRITICAL FIX: Create Firebase Auth account
  try {
    const admin = require('firebase-admin');

    // Only create Firebase account for email-based auth (not phone-only)
    if (hasEmailAuth) {
      const firebaseUserRecord = await admin.auth().createUser({
        email: userData.email,
        password: password,
        displayName: name,
        emailVerified: false, // Will be verified when admin approves
      });

      console.log('✅ Firebase Auth account created:', firebaseUserRecord.uid);

      // Update MongoDB user with Firebase UID
      user.firebaseUid = firebaseUserRecord.uid;
      await user.save();

      console.log('✅ Firebase UID linked to MongoDB user');
    } else {
      console.log('⏩ Skipping Firebase Auth creation for phone-only partner (will use OTP)');
    }
  } catch (firebaseError) {
    console.warn('⚠️ Firebase Auth creation failed, but continuing for local testing:', firebaseError.message);
  }

  // 3. Create the DeliveryPartner profile linked to the User
  const partner = new DeliveryPartner({
    name,
    email: userData.email || email, // Optional: may be undefined for phone-only partners
    phone: normalizedPhone || phone, // Use normalized phone if available
    vehicle_type,
    vehicle_number,
    license_number,
    seller: req.user._id,
    user: user._id, // Link to the Auth User
  });

  try {
    const createdPartner = await partner.save();
    console.log('✅ Delivery partner profile created:', createdPartner._id);
    res.status(201).json(createdPartner);
  } catch (error) {
    // Rollback user creation if partner save fails
    await User.findByIdAndDelete(user._id);

    // Also delete Firebase account if it was created
    if (user.firebaseUid) {
      try {
        const admin = require('firebase-admin');
        await admin.auth().deleteUser(user.firebaseUid);
        console.log('✅ Firebase account rolled back');
      } catch (fbError) {
        console.error('⚠️ Failed to rollback Firebase account:', fbError.message);
      }
    }

    res.status(500);
    throw new Error('Failed to save delivery partner profile to database');
  }
});

// @desc    Update a delivery partner
// @route   PUT /api/delivery-partners/partners/:id
// @access  Private/Seller
const updateDeliveryPartner = asyncHandler(async (req, res) => {
  const { name, phone, vehicle_type, vehicle_number, license_number } = req.body;

  const partner = await DeliveryPartner.findById(req.params.id);

  if (partner && partner.seller.toString() === req.user._id.toString()) {
    partner.name = name || partner.name;
    partner.phone = phone || partner.phone;
    partner.vehicle_type = vehicle_type || partner.vehicle_type;
    partner.vehicle_number = vehicle_number || partner.vehicle_number;
    partner.license_number = license_number || partner.license_number;

    const updatedPartner = await partner.save();
    res.json(updatedPartner);
  } else {
    res.status(404);
    throw new Error('Delivery partner not found or not authorized');
  }
});

// @desc    Delete a delivery partner
// @route   DELETE /api/delivery-partners/partners/:id
// @access  Private/Seller
const deleteDeliveryPartner = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findById(req.params.id);

  if (partner && partner.seller.toString() === req.user._id.toString()) {
    await partner.deleteOne();
    res.json({ message: 'Delivery partner removed' });
  } else {
    res.status(404);
    throw new Error('Delivery partner not found or not authorized');
  }
});

// @desc    Get orders ready for delivery for the current seller
// @access  Private/Seller
const getOrdersForDelivery = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    seller: req.user._id,
    orderStatus: { $in: ['packed', 'shipped'] },
  }).populate('user', 'name email phone')
    .populate('seller', 'name phone businessDetails')
    .populate('deliveryPartner', 'name phone vehicle_number');

  res.json(orders);
});

// @desc    Assign delivery partner to order
// @route   PUT /api/delivery-partners/orders/:id
// @access  Private/Seller
const assignDeliveryToOrder = asyncHandler(async (req, res) => {
  try {
    console.log('🔵 assignDeliveryToOrder called with:', {
      orderId: req.params.id,
      body: req.body,
      userId: req.user._id
    });

    const { deliveryPartner: partnerIdFromReqBody, partnerId, trackingNumber } = req.body;
    const deliveryPartner = partnerIdFromReqBody || partnerId;

    if (!deliveryPartner) {
      console.error('❌ Missing deliveryPartner in request body');
      res.status(400);
      throw new Error('Delivery partner ID is required');
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      console.error(`❌ Order ${req.params.id} not found`);
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.seller.toString() !== req.user._id.toString()) {
      console.error(`❌ Seller ${req.user._id} not authorized for order ${req.params.id}`);
      res.status(403);
      throw new Error('Not authorized to modify this order');
    }

    console.log(`📦 Assigning partner ${deliveryPartner} to order ${req.params.id}`);

    // Use updateOne to bypass validation completely and only update specific fields
    await Order.updateOne(
      { _id: order._id },
      {
        $set: {
          deliveryPartner: deliveryPartner,
          deliveryPartnerStatus: 'assigned',
          trackingNumber: trackingNumber,
          orderStatus: 'shipped',
          shippedAt: Date.now()
        }
      }
    );

    // Process the updated order object for response and broadcast
    order.deliveryPartner = deliveryPartner;
    order.deliveryPartnerStatus = 'assigned';
    order.trackingNumber = trackingNumber;
    order.orderStatus = 'shipped';
    order.shippedAt = Date.now();
    const updatedOrder = order; // Use the modified order object

    console.log(`✅ Order ${order._id} assigned to partner ${deliveryPartner} and set to shipped`);

    // ✅ FIXED: Send notification to delivery partner
    const DeliveryPartner = require('../models/deliveryPartner');
    const Notification = require('../models/Notification');
    const partner = await DeliveryPartner.findById(deliveryPartner);
    if (partner && partner.user) {
      await Notification.create({
        user: partner.user,
        type: 'ORDER_ASSIGNED',
        message: `New order #${order._id.toString().slice(-6)} assigned to you for delivery`,
        relatedEntity: order._id,
        entityModel: 'Order'
      });
      console.log(`✅ Notification sent to delivery partner ${partner.user}`);
    }

    // ✅ FIXED: Send notification to customer
    await Notification.create({
      user: order.user,
      type: 'ORDER_STATUS_UPDATE',
      message: `Your order #${order._id.toString().slice(-6)} has been shipped and assigned to delivery partner`,
      relatedEntity: order._id,
      entityModel: 'Order'
    });

    // Broadcast order update for real-time refresh
    const broadcastOrderUpdate = req.app.get('broadcastOrderUpdate');
    if (broadcastOrderUpdate) {
      console.log(`📡 Broadcasting update for order ${updatedOrder._id}`);
      broadcastOrderUpdate(updatedOrder._id, updatedOrder.orderStatus);
    } else {
      console.error('❌ broadcastOrderUpdate function not found in app settings');
    }

    // ✅ FIXED: Emit socket events for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`seller_${req.user._id}`).emit('orderUpdated', updatedOrder);
      io.to(`user_${order.user.toString()}`).emit('ORDER_UPDATE', {
        orderId: order._id,
        status: updatedOrder.orderStatus,
        deliveryPartner: updatedOrder.deliveryPartner
      });
      if (partner && partner.user) {
        io.to(`delivery_partner_${partner.user.toString()}`).emit('ORDER_ASSIGNED', updatedOrder);
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('❌ Error in assignDeliveryToOrder:', error);
    throw error;
  }
});

// @desc    Submit KYC for delivery partner
// @route   PUT /api/delivery-partners/partners/:id/kyc
// @access  Private/Seller
const submitKYC = asyncHandler(async (req, res) => {
  const { aadharNumber, panNumber } = req.body;
  const partner = await DeliveryPartner.findById(req.params.id);

  if (partner && partner.seller.toString() === req.user._id.toString()) {
    partner.aadharNumber = aadharNumber || partner.aadharNumber;
    partner.panNumber = panNumber || partner.panNumber;

    // Handle file uploads (photos uploaded via multer)
    if (req.files) {
      // Store only the relative path from uploads directory
      // Convert backslashes to forward slashes for consistent URL construction
      if (req.files.aadharPhoto) {
        const relativePath = req.files.aadharPhoto[0].path.replace(/\\/g, '/').replace(/^.*\/uploads\//, 'uploads/');
        partner.aadharPhoto = relativePath;
      }
      if (req.files.panPhoto) {
        const relativePath = req.files.panPhoto[0].path.replace(/\\/g, '/').replace(/^.*\/uploads\//, 'uploads/');
        partner.panPhoto = relativePath;
      }
      if (req.files.driverPhoto) {
        const relativePath = req.files.driverPhoto[0].path.replace(/\\/g, '/').replace(/^.*\/uploads\//, 'uploads/');
        partner.driverPhoto = relativePath;
      }
    }

    partner.kycStatus = 'pending'; // Reset to pending on resubmission
    const updatedPartner = await partner.save();
    res.json(updatedPartner);
  } else {
    res.status(404);
    throw new Error('Delivery partner not found or not authorized');
  }
});

// @desc    Get pending KYC submissions (Admin)
// @route   GET /api/delivery-partners/admin/kyc/pending
// @access  Private/Admin
const getPendingKYC = asyncHandler(async (req, res) => {
  const partners = await DeliveryPartner.find({ kycStatus: 'pending' })
    .populate('seller', 'name email businessDetails')
    .sort({ createdAt: -1 });
  res.json(partners);
});

// @desc    Approve/Reject KYC
// @route   PUT /api/delivery-partners/admin/kyc/:id
// @access  Private/Admin
const approveKYC = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  // Populate user to access linked User document
  const partner = await DeliveryPartner.findById(req.params.id).populate('user');

  if (!partner) {
    res.status(404);
    throw new Error('Delivery partner not found');
  }

  // Update delivery partner status
  partner.kycStatus = status; // 'approved' or 'rejected'

  if (status === 'rejected') {
    partner.kycRejectionReason = rejectionReason;
  } else if (status === 'approved') {
    partner.approvedBy = req.user._id;
    partner.approvedAt = Date.now();
    partner.kycRejectionReason = undefined;

    // ✅ CRITICAL FIX: Update linked User document for login access
    if (partner.user) {
      console.log('🔄 Updating User document for delivery partner:', partner.user._id);

      const user = await User.findById(partner.user);
      if (user) {
        // Enable login and set proper role
        user.isVerified = true;
        user.emailVerified = true;
        user.role = 'deliveryPartner';

        await user.save();
        console.log('✅ User document updated successfully');

        // ✅ CRITICAL FIX: Sync to Firestore for Firebase Auth
        try {
          const firebaseUserSync = require('../utils/firebaseUserSync');
          await firebaseUserSync.syncUser(user);
          console.log('✅ Delivery partner synced to Firestore');
        } catch (firestoreError) {
          console.error('⚠️ Firestore sync failed (non-critical):', firestoreError.message);
          // Don't fail the approval if Firestore sync fails
        }
      } else {
        console.warn('⚠️ Linked User document not found for partner:', partner._id);
      }
    } else {
      console.warn('⚠️ No linked User for delivery partner:', partner._id);
    }
  }

  const updatedPartner = await partner.save();
  console.log(`✅ Delivery partner ${status}:`, updatedPartner._id);

  res.json(updatedPartner);
});

// @desc    Report COD collected
// @route   PUT /api/delivery-partners/orders/:id/cod
// @access  Private/Seller
const reportCOD = asyncHandler(async (req, res) => {
  const { codAmount, codProofPhoto } = req.body;
  const order = await Order.findById(req.params.id);

  if (order && order.seller.toString() === req.user._id.toString()) {
    order.codAmount = codAmount;
    order.codCollected = true;
    order.codCollectedAt = Date.now();
    order.codReportedBy = req.user._id;
    if (codProofPhoto) order.codProofPhoto = codProofPhoto;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found or not authorized');
  }
});

// @desc    Get orders assigned to the logged-in delivery partner
// @route   GET /api/orders/assigned
// @access  Private/DeliveryPartner
const getAssignedOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;

  // 1. Find the delivery partner profiles linked to this user
  const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
  const profileIds = partnerProfiles.map(p => p._id);

  if (profileIds.length === 0) {
    return res.json({ success: true, orders: [] }); // No profile = no assigned orders
  }

  // 2. Build query
  const query = { deliveryPartner: { $in: profileIds } };

  if (status) {
    query.orderStatus = status;
  } else {
    // Include all statuses that a delivery partner should see, including completed history
    query.orderStatus = { $in: ['confirmed', 'placed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'completed'] };
  }

  // 3. Fetch orders
  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .populate('seller', 'name phone businessDetails')
    .sort('-updatedAt');


  res.json({ success: true, orders });
});

// @desc    Get single order details for delivery partner
// @route   GET /api/delivery-partners/orders/:orderId
// @access  Private/DeliveryPartner
const getOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // 1. Get ALL delivery partner profiles linked to this user
  const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
  const profileIds = partnerProfiles.map(p => p._id.toString());

  if (profileIds.length === 0) {
    res.status(404);
    throw new Error('Delivery partner profile not found');
  }

  // 2. Fetch order and verify it's assigned to any of these profiles
  const order = await Order.findById(orderId)
    .populate('user', 'name email phone')
    .populate('seller', 'name phone email businessDetails')
    .populate('deliveryPartner');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // 3. Verify this order is assigned to any of the logged-in user's profiles
  if (!order.deliveryPartner || !profileIds.includes(order.deliveryPartner._id.toString())) {
    res.status(403);
    throw new Error('You are not authorized to view this order');
  }

  res.json({ success: true, order });
});

// @desc    Start delivery (mark as in_transit)
// @route   POST /api/delivery-partners/orders/:orderId/start
// @access  Private/DeliveryPartner
const startDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { latitude, longitude } = req.body;

  // 1. Get delivery partner profiles
  const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
  const profileIds = partnerProfiles.map(p => p._id.toString());

  if (profileIds.length === 0) {
    res.status(404);
    throw new Error('Delivery partner profile not found');
  }

  // 2. Fetch order
  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // 3. Verify assignment against any profile
  if (!order.deliveryPartner || !profileIds.includes(order.deliveryPartner.toString())) {
    res.status(403);
    throw new Error('You are not authorized to update this order');
  }

  // 4. Verify order status allows starting delivery
  if (!['confirmed', 'placed', 'processing', 'packed', 'shipped', 'out_for_delivery'].includes(order.orderStatus)) {
    res.status(400);
    throw new Error(`Cannot start delivery for order with status: ${order.orderStatus}`);
  }

  // 5. Update order status
  order.deliveryPartnerStatus = 'in_transit';
  order.orderStatus = 'out_for_delivery';
  order.deliveryStartedAt = new Date();

  // Optional: Capture start location
  if (latitude && longitude) {
    order.deliveryStartLocation = {
      latitude,
      longitude,
      timestamp: new Date()
    };
  }

  // Add to status history
  order.statusHistory.push({
    status: 'out_for_delivery',
    timestamp: new Date(),
    reason: 'Delivery started by partner'
  });

  await order.save();

  res.json({
    success: true,
    message: 'Delivery started successfully',
    order
  });
});

// @desc    Confirm delivery with photo proof
// @route   POST /api/delivery-partners/orders/:orderId/confirm
// @access  Private/DeliveryPartner
const confirmDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { latitude, longitude, notes } = req.body;

  // 1. Get delivery partner profiles
  const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
  const profileIds = partnerProfiles.map(p => p._id.toString());

  if (profileIds.length === 0) {
    res.status(404);
    throw new Error('Delivery partner profile not found');
  }

  // 2. Fetch order
  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // 3. Verify assignment against any profile
  if (!order.deliveryPartner || !profileIds.includes(order.deliveryPartner.toString())) {
    res.status(403);
    throw new Error('You are not authorized to update this order');
  }

  const partnerProfile = partnerProfiles.find(p => p._id.toString() === order.deliveryPartner.toString());

  // 4. Verify order status
  if (order.orderStatus === 'delivered') {
    res.status(400);
    throw new Error('Order is already marked as delivered');
  }

  // 5. Check for photo proof (required)
  if (!req.file) {
    res.status(400);
    throw new Error('Delivery photo proof is required');
  }

  // Check if this is a replacement delivery
  if (order.replacementStatus === 'approved' || order.orderStatus === 'replacement_approved') {
    // 6a. Update replacement delivery details
    order.replacementStatus = 'delivered';
    order.orderStatus = 'delivered'; // Or 'replacement_delivered' if you prefer specific distinction

    order.replacementDeliveryConfirmation = {
      photoProofUrl: `/uploads/${req.file.filename}`,
      deliveredAt: new Date(),
      location: latitude && longitude ? {
        latitude,
        longitude,
        timestamp: new Date()
      } : undefined,
      deliveredBy: req.user._id
    };

    // Add status history
    order.statusHistory.push({
      status: 'replacement_delivered',
      timestamp: new Date(),
      reason: 'Replacement delivery confirmed by partner'
    });
  } else {
    // 6b. Standard delivery update
    order.deliveryPartnerStatus = 'delivered';
    order.orderStatus = 'delivered';
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.actualDeliveryDate = new Date();

    // Set delivery confirmation details
    order.deliveryConfirmation = {
      otpVerified: false,
      verifiedAt: new Date(),
      verifiedBy: req.user._id,
      photoProofUrl: `/uploads/${req.file.filename}`,
      location: latitude && longitude ? {
        latitude,
        longitude,
        accuracy: 0,
        timestamp: new Date().toISOString()
      } : undefined,
      notes: notes || 'Delivery confirmed with photo proof'
    };

    // Add status history
    order.statusHistory.push({
      status: 'delivered',
      timestamp: new Date(),
      reason: 'Delivery confirmed by partner with photo proof'
    });
  }

  await order.save();

  // ✅ Automated Settlement Handling
  try {
    await SettlementService.processDeliverySettlement(order._id);
    console.log(`✅ Automated settlement processed for order ${order._id}`);
  } catch (settleErr) {
    console.error('⚠️ Failed to process automated settlement:', settleErr.message);
    // Note: We don't fail the whole delivery confirmation if settlement logic fails, 
    // but we log it for reconciliation.
  }

  // ✅ Trigger referral rewards on first delivered+paid order
  try {
    const { processReferralRewards } = require('./rewardsController');
    if (typeof processReferralRewards === 'function') {
      await processReferralRewards(order._id);
      console.log(`✅ Referral reward processing triggered for order ${order._id}`);
    }
  } catch (refErr) {
    console.error('⚠️ Referral reward processing error (non-fatal):', refErr.message);
  }

  // ✅ Update delivery partner stats
  try {
    partnerProfile.totalDeliveries = (partnerProfile.totalDeliveries || 0) + 1;
    await partnerProfile.save();
    console.log(`✅ Updated total deliveries for partner ${partnerProfile._id}`);
    
    // Evaluate real-time incentives
    await evaluateIncentives(partnerProfile._id);
  } catch (statErr) {
    console.error('⚠️ Failed to update partner stats:', statErr.message);
  }

  res.json({
    success: true,
    message: 'Delivery confirmed successfully',
    order
  });
});

// @desc    Request replacement for an order
// @route   POST /api/delivery-partners/orders/:orderId/replacement
// @access  Private/DeliveryPartner
const requestReplacement = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  console.log('📝 Replacement Request Received:', {
    orderId,
    body: req.body,
    file: req.file ? { fieldname: req.file.fieldname, mimetype: req.file.mimetype, size: req.file.size } : 'No File',
    contentType: req.headers['content-type']
  });

  const { reason, description } = req.body;

  // Import Replacement model
  const Replacement = require('../models/Replacement.js');

  // 1. Validate required fields
  if (!reason || !description) {
    console.warn('❌ Missing reason or description');
    res.status(400);
    throw new Error('Reason and description are required');
  }

  // 2. Check for photo proof (required for delivery partner)
  if (!req.file) {
    console.warn('❌ Missing photo proof file');
    res.status(400);
    throw new Error('Photo proof is required for replacement requests');
  }

  // 3. Get delivery partner profiles
  const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
  const profileIds = partnerProfiles.map(p => p._id.toString());

  if (profileIds.length === 0) {
    res.status(404);
    throw new Error('Delivery partner profile not found');
  }

  // 4. Fetch order
  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // 5. Verify assignment against any profile
  if (!order.deliveryPartner || !profileIds.includes(order.deliveryPartner.toString())) {
    res.status(403);
    throw new Error('You are not authorized to request replacement for this order');
  }

  const partnerProfile = partnerProfiles.find(p => p._id.toString() === order.deliveryPartner.toString());

  // 6. Check if replacement already requested
  const existingReplacement = await Replacement.findOne({
    order: orderId,
    status: { $in: ['pending', 'approved'] }
  });

  if (existingReplacement) {
    res.status(400);
    throw new Error('A replacement request already exists for this order');
  }

  // 7. Create replacement request
  const replacement = await Replacement.create({
    order: orderId,
    requestedBy: req.user._id,
    requesterRole: 'deliveryPartner',
    reason,
    description,
    photoProof: `/uploads/${req.file.filename}`,
    status: 'pending'
  });

  // 8. Update order with replacement details
  order.hasReplacementRequest = true;
  order.replacementStatus = 'requested';
  order.replacementReason = reason;
  order.replacementDescription = description;
  order.replacementPhotoUrl = `/uploads/${req.file.filename}`;
  order.replacementRequestedBy = req.user._id;
  order.replacementRequestedAt = Date.now();

  await order.save();

  // Notify Seller logic can go here

  res.status(201).json({
    success: true,
    message: 'Replacement request submitted successfully',
    replacement
  });
});

// @desc    Review replacement request (Approve/Reject/Refund)
// @route   PUT /api/delivery-partners/orders/:orderId/replacement-review
// @access  Private/Seller/Admin
const reviewReplacement = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { decision, notes } = req.body; // decision: 'approve', 'reject', 'refund'

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Authorization check (Seller or Admin)
  if (order.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to review this replacement');
  }

  if (decision === 'approve') {
    order.replacementStatus = 'approved';
    order.orderStatus = 'replacement_approved'; // This status indicates we are waiting for re-dispatch
  } else if (decision === 'reject') {
    order.replacementStatus = 'rejected';
    // If rejected, order remains "delivered" (or whatever it was)
    order.orderStatus = 'delivered';
  } else if (decision === 'refund') {
    order.replacementStatus = 'refund_approved';
    order.orderStatus = 'refund_approved';
  } else {
    res.status(400);
    throw new Error('Invalid decision. Use approve, reject, or refund');
  }

  order.replacementDecisionBy = req.user._id;
  order.replacementDecisionAt = Date.now();
  order.replacementDecisionNotes = notes;

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Re-dispatch replacement order
// @route   POST /api/delivery-partners/orders/:orderId/redispatch
// @access  Private/Seller
const redispatchReplacement = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { deliveryPartnerId } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.replacementStatus !== 'approved') {
    res.status(400);
    throw new Error('Replacement must be approved before re-dispatch');
  }

  // 1. Assign new partner
  order.deliveryPartner = deliveryPartnerId;

  // 2. Reset Status to 'shipped' so it appears in the new partner's assigned list
  order.orderStatus = 'shipped';
  order.deliveryPartnerStatus = 'assigned';

  // 3. Reset Delivery Tracking Fields (Clear previous delivery data)
  order.isDelivered = false;
  order.deliveredAt = undefined;
  order.actualDeliveryDate = undefined;
  order.deliveryStartedAt = undefined;
  order.deliveryStartLocation = undefined;
  order.deliveryPartnerPickedAt = undefined;
  order.pickupConfirmedBy = undefined;
  order.deliveryConfirmation = undefined;
  order.codCollected = false;
  order.codCollectedAt = undefined;

  // 4. Record this action
  order.statusHistory.push({
    status: 'shipped',
    timestamp: new Date(),
    reason: 'Replacement re-dispatched to new partner'
  });

  const updatedOrder = await order.save();

  // Notify new partner
  const DeliveryPartner = require('../models/deliveryPartner');
  const Notification = require('../models/Notification');
  const partner = await DeliveryPartner.findById(deliveryPartnerId);

  if (partner && partner.user) {
    await Notification.create({
      user: partner.user,
      type: 'ORDER_ASSIGNED',
      message: `Replacement order #${order._id.toString().slice(-6)} assigned to you`,
      relatedEntity: order._id,
      entityModel: 'Order'
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`delivery_${partner.user.toString()}`).emit('ORDER_ASSIGNED', updatedOrder);
    }
  }

  res.json({ success: true, message: 'Replacement re-dispatched successfully', order: updatedOrder });
});

// @desc    Generate Razorpay Payment Link for Delivery Partner COD collection
// @route   POST /api/dp/orders/:orderId/generate-delivery-payment-link
// @access  Private/DeliveryPartner
const generateDeliveryPaymentLink = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId).populate('user');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Ensure this is a COD order that isn't paid fully
  if (order.paymentMethod !== 'cod') {
    res.status(400);
    throw new Error('Only COD orders require payment collection on delivery');
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error('This order is already paid entirely');
  }

  const razorpayKey = process.env.RAZORPAY_KEY_ID;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKey || !razorpaySecret) {
    res.status(503);
    throw new Error('Payment gateway is currently unavailable');
  }

  const Razorpay = require('razorpay');
  const instance = new Razorpay({
    key_id: razorpayKey,
    key_secret: razorpaySecret,
  });

  const amountToCollect = order.remainingCodAmount > 0 ? order.remainingCodAmount : order.totalPrice;

  try {
    const paymentLink = await instance.paymentLink.create({
      amount: Math.round(amountToCollect * 100),
      currency: "INR",
      accept_partial: false,
      description: `PAYMENT FOR RICE MILL: ₹${amountToCollect} (STRICTLY UPI ONLY)`,
      customer: {
        name: order.user?.name || "Customer",
        email: order.user?.email || "customer@example.com",
        contact: order.user?.phone || ""
      },
      notify: { sms: false, email: false },
      notes: {
        order_id: order._id.toString(),
        type: 'delivery_cod',
        instruction: 'STRICTLY_UPI'
      }
    });

    res.json({
      success: true,
      paymentLinkId: paymentLink.id,
      paymentLinkUrl: paymentLink.short_url,
      amount: amountToCollect
    });
  } catch (error) {
    console.error('Error creating delivery payment link:', error);
    res.status(500);
    throw new Error('Failed to generate payment QR code');
  }
});

// @desc    Check status of Delivery Payment Link
// @route   GET /api/dp/orders/:orderId/check-delivery-payment/:paymentLinkId
// @access  Private/DeliveryPartner
const checkDeliveryPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId, paymentLinkId } = req.params;
  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.isPaid) {
    return res.json({ success: true, isPaid: true });
  }

  const razorpayKey = process.env.RAZORPAY_KEY_ID;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  const Razorpay = require('razorpay');
  const instance = new Razorpay({ key_id: razorpayKey, key_secret: razorpaySecret });

  try {
    const paymentLink = await instance.paymentLink.fetch(paymentLinkId);

    if (paymentLink.status === 'paid') {
      // Mark the order as paid internally here if webhook hasn't caught it yet
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentStatus = 'completed';
      order.codSettled = true; // No cash to settle later!

      const Payment = require('../models/Payment');
      const amountToCollect = order.remainingCodAmount > 0 ? order.remainingCodAmount : order.totalPrice;

      // Create a Payment record for the exact amount collected
      await Payment.findOneAndUpdate(
        { order: order._id, amount: amountToCollect, method: 'razorpay' },
        {
          $set: {
            status: 'completed',
            notes: 'Delivery COD Paid via QR Link',
            user: order.user,
            seller: order.seller,
            currency: 'INR',
            commissionAmount: order.commissionAmount,
            sellerPayoutAmount: order.sellerAmount,
            payoutStatus: 'pending',
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await order.save();

      if (req.broadcastOrderUpdate) {
        req.broadcastOrderUpdate(orderId, { status: 'payment_completed' });
      }

      return res.json({ success: true, isPaid: true });
    }

    res.json({ success: true, isPaid: false, status: paymentLink.status });
  } catch (error) {
    console.error('Error fetching payment link status:', error);
    res.status(500);
    throw new Error('Failed to check payment status');
  }
});

// @desc    Get real-time incentives progress
// @route   GET /api/delivery-partners/incentives
// @access  Private/DeliveryPartner
const getIncentives = asyncHandler(async (req, res) => {
    const DeliveryPartner = require('../models/deliveryPartner');
    const { Incentive, DPIncentiveProgress } = require('../models/Incentive.js');
    
    const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
    if (partnerProfiles.length === 0) {
        return res.json({ success: true, incentives: [] });
    }
    
    const dpId = partnerProfiles[0]._id;
    const activeIncentives = await Incentive.find({ isActive: true });
    
    const responseData = [];
    
    for (const incentive of activeIncentives) {
        const { start } = getPeriodBoundaries(incentive.period);
        let progress = await DPIncentiveProgress.findOne({
            deliveryPartner: dpId,
            incentive: incentive._id,
            periodStart: start
        });
        
        responseData.push({
            id: incentive._id,
            title: incentive.title,
            target: incentive.target,
            bonus: incentive.bonusAmount,
            period: incentive.period,
            color: incentive.color,
            current: progress ? progress.currentCount : 0,
            isAchieved: progress ? progress.isAchieved : false
        });
    }
    
    res.json({ success: true, incentives: responseData });
});

module.exports = {
  getDeliveryPartners,
  createDeliveryPartner,
  updateDeliveryPartner,
  deleteDeliveryPartner,
  getOrdersForDelivery,
  assignDeliveryToOrder,
  submitKYC,
  getPendingKYC,
  approveKYC,
  reportCOD,
  getAssignedOrders,
  getOrderDetails,
  startDelivery,
  confirmDelivery,
  requestReplacement,
  reviewReplacement,
  redispatchReplacement,
  generateDeliveryPaymentLink,
  checkDeliveryPaymentStatus,
  getIncentives
};