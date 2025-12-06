const DeliveryPartner = require('../models/deliveryPartner.js');
const Order = require('../models/Order.js');
const asyncHandler = require('../middleware/asyncHandler.js');
const User = require('../models/User.js');

// @desc    Get all delivery partners for the current seller
// @route   GET /api/delivery-partners/partners
// @access  Private/Seller
const getDeliveryPartners = asyncHandler(async (req, res) => {
  const partners = await DeliveryPartner.find({ seller: req.user._id });
  res.json(partners);
});

// @desc    Create a delivery partner for the current seller
// @route   POST /api/delivery-partners/partners
// @access  Private/Seller
const createDeliveryPartner = asyncHandler(async (req, res) => {
  const { name, phone, vehicle_type, vehicle_number, license_number } = req.body;

  if (!name || !phone || !vehicle_type || !vehicle_number || !license_number) {
    res.status(400);
    throw new Error('All fields (name, phone, vehicle_type, vehicle_number, license_number) are required');
  }

  const partner = new DeliveryPartner({
    name,
    phone,
    vehicle_type,
    vehicle_number,
    license_number,
    seller: req.user._id,
  });

  try {
    const createdPartner = await partner.save();
    res.status(201).json(createdPartner);
  } catch (error) {
    res.status(500);
    throw new Error('Failed to save delivery partner to database');
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
  const { deliveryPartner, trackingNumber = '' } = req.body;

  const order = await Order.findById(req.params.id);

  if (order && order.seller.toString() === req.user._id.toString()) {
    order.deliveryPartner = deliveryPartner;
    order.trackingNumber = trackingNumber;
    order.orderStatus = 'shipped'; // Ensure status is set correctly
    order.shippedAt = Date.now();

    const updatedOrder = await order.save();

    // Broadcast order update for real-time refresh
    const broadcastOrderUpdate = req.app.get('broadcastOrderUpdate');
    if (broadcastOrderUpdate) {
      broadcastOrderUpdate(updatedOrder._id, updatedOrder.orderStatus);
    }

    // Refresh the orders list to reflect the updated status
    req.app.get('io').to(`seller_${req.user._id}`).emit('orderUpdated', updatedOrder);

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found or not authorized');
  }
});

module.exports = {
  getDeliveryPartners,
  createDeliveryPartner,
  updateDeliveryPartner,
  deleteDeliveryPartner,
  getOrdersForDelivery,
  assignDeliveryToOrder,
};