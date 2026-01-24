const DeliveryPartner = require('../models/deliveryPartner.js');
const Order = require('../models/Order.js');
const asyncHandler = require('../middleware/asyncHandler.js');
const User = require('../models/User.js');

// @desc    Get all delivery partners for the current seller
// @route   GET /api/delivery-partners/partners
// @access  Private/Seller
const getDeliveryPartners = asyncHandler(async (req, res) => {
  console.log('🔍 Fetching delivery partners for seller:', req.user._id);
  const partners = await DeliveryPartner.find({ seller: req.user._id });
  console.log('📦 Found partners:', {
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
    isVerified: true // Pre-verified since seller is adding them
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
    res.status(201).json(createdPartner);
  } catch (error) {
    // Rollback user creation if partner save fails
    await User.findByIdAndDelete(user._id);
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
  const partner = await DeliveryPartner.findById(req.params.id);

  if (partner) {
    partner.kycStatus = status; // 'approved' or 'rejected'
    if (status === 'rejected') {
      partner.kycRejectionReason = rejectionReason;
    } else if (status === 'approved') {
      partner.approvedBy = req.user._id;
      partner.approvedAt = Date.now();
      partner.kycRejectionReason = undefined;
    }

    const updatedPartner = await partner.save();
    res.json(updatedPartner);
  } else {
    res.status(404);
    throw new Error('Delivery partner not found');
  }
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
};