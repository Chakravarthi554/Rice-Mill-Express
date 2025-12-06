const express=require('express');
const {
  getDeliveryPartners,
  createDeliveryPartner,
  updateDeliveryPartner,
  deleteDeliveryPartner,
  getOrdersForDelivery,
  assignDeliveryToOrder,
} =require('../controllers/deliveryController.js');
const router = express.Router();
const { protect, role } =require('../middleware/auth.js');

router.route('/partners')
  .get(protect, role('seller'), getDeliveryPartners)
  .post(protect, role('seller'), createDeliveryPartner);
router.route('/partners/:id')
  .put(protect, role('seller'), updateDeliveryPartner)
  .delete(protect, role('seller'), deleteDeliveryPartner);

router.get('/orders/ready-for-delivery', protect, role('seller'), getOrdersForDelivery);
router.put('/orders/:id', protect, role('seller'), assignDeliveryToOrder);

module.exports = router;