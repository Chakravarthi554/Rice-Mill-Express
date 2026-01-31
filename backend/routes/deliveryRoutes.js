const express = require('express');
const {
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
} = require('../controllers/deliveryController.js');
const router = express.Router();
const { protect, role } = require('../middleware/auth.js');
const upload = require('../utils/uploadMiddleware.js'); // Multer for file uploads

router.route('/partners')
  .get(protect, role('seller'), getDeliveryPartners)
  .post(protect, role('seller'), createDeliveryPartner);
router.route('/partners/:id')
  .put(protect, role('seller'), updateDeliveryPartner)
  .delete(protect, role('seller'), deleteDeliveryPartner);

// Partner-specific routes
router.get('/my-deliveries', protect, role('deliveryPartner'), getAssignedOrders);

// KYC routes
router.put('/partners/:id/kyc', protect, role('seller'), upload.fields([
  { name: 'aadharPhoto', maxCount: 1 },
  { name: 'panPhoto', maxCount: 1 },
  { name: 'driverPhoto', maxCount: 1 }
]), submitKYC);

router.get('/admin/kyc/pending', protect, role('admin'), getPendingKYC);
router.put('/admin/kyc/:id', protect, role('admin'), approveKYC);

// Order routes
router.get('/orders/ready-for-delivery', protect, role('seller'), getOrdersForDelivery);
router.put('/orders/:id', protect, role('seller'), assignDeliveryToOrder);
router.put('/orders/:id/cod', protect, role('seller'), reportCOD);

// Delivery Partner Order Flow Routes
router.get('/orders/:orderId', protect, role('deliveryPartner'), getOrderDetails);
router.post('/orders/:orderId/start', protect, role('deliveryPartner'), startDelivery);
router.post('/orders/:orderId/confirm', protect, role('deliveryPartner'), upload.single('deliveryPhoto'), confirmDelivery);
router.post('/orders/:orderId/replacement', protect, role('deliveryPartner'), upload.single('replacementPhoto'), requestReplacement);

module.exports = router;