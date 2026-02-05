const DeliveryPartner = require('../models/deliveryPartner.js');
const Order = require('../models/Order.js');
const asyncHandler = require('../middleware/asyncHandler.js');
const User = require('../models/User.js');

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
    // Rollback MongoDB user if Firebase creation fails
    await User.findByIdAndDelete(user._id);
    console.error('❌ Firebase Auth creation failed:', firebaseError.message);
    res.status(500);
    throw new Error(`Failed to create Firebase account: ${firebaseError.message}`);
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
          trackingNumber: trackingNumber,
          orderStatus: 'shipped',
          shippedAt: Date.now()
        }
      }
    );

    // Process the updated order object for response and broadcast
    order.deliveryPartner = deliveryPartner;
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
        io.to(`delivery_${partner.user.toString()}`).emit('ORDER_ASSIGNED', updatedOrder);
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

  // 1. Find the delivery partner profile linked to this user
  const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

  if (!partnerProfile) {
    return res.json({ success: true, orders: [] }); // No profile = no assigned orders
  }

  // 2. Build query
  const query = { deliveryPartner: partnerProfile._id };

  if (status) {
    query.orderStatus = status;
  } else {
    query.orderStatus = { $in: ['shipped', 'out_for_delivery', 'delivered'] };
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

  // 1. Get delivery partner profile
  const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

  if (!partnerProfile) {
    res.status(404);
    throw new Error('Delivery partner profile not found');
  }

  // 2. Fetch order and verify it's assigned to this partner
  const order = await Order.findById(orderId)
    .populate('user', 'name email phone')
    .populate('seller', 'name phone email businessDetails')
    .populate('deliveryPartner');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // 3. Verify this order is assigned to the logged-in delivery partner
  if (!order.deliveryPartner || order.deliveryPartner._id.toString() !== partnerProfile._id.toString()) {
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

  // 1. Get delivery partner profile
  const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

  if (!partnerProfile) {
    res.status(404);
    throw new Error('Delivery partner profile not found');
  }

  // 2. Fetch order
  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // 3. Verify assignment
  if (!order.deliveryPartner || order.deliveryPartner.toString() !== partnerProfile._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to update this order');
  }

  // 4. Verify order status allows starting delivery
  if (!['shipped', 'out_for_delivery'].includes(order.orderStatus)) {
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

  // 1. Get delivery partner profile
  const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

  if (!partnerProfile) {
    res.status(404);
    throw new Error('Delivery partner profile not found');
  }

  // 2. Fetch order
  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // 3. Verify assignment
  if (!order.deliveryPartner || order.deliveryPartner.toString() !== partnerProfile._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to update this order');
  }

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

  // 3. Get delivery partner profile
  const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

  if (!partnerProfile) {
    res.status(404);
    throw new Error('Delivery partner profile not found');
  }

  // 4. Fetch order
  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // 5. Verify assignment (Relaxed check if order is delivered, enabling post-delivery request)
  // If order is delivered, any active partner *could* theoretically request, but usually it's the one who delivered.
  // We'll stick to strict assignment check for now, assuming partner is still assigned.
  if (!order.deliveryPartner || order.deliveryPartner.toString() !== partnerProfile._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to request replacement for this order');
  }

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
  redispatchReplacement
};