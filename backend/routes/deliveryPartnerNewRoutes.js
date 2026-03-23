const express = require('express');
const router = express.Router();
const { protect, role } = require('../middleware/auth.js');
const multer = require('multer');

// Configure multer for memory storage (Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

// Import controllers
const {
    getDashboard,
    getMyOrders,
    getOrderDetails,
    confirmPickup,
    startNavigation,
    confirmCOD,
    uploadDeliveryPhotoAndComplete,
    requestReplacement,
    requestWithdrawal,
    getWithdrawalHistory,
} = require('../controllers/deliveryPartnerController.js');

const {
    getHistory,
    getProfile,
    updateProfile,
    getDevices,
    logoutAllDevices,
    sendEmergencyAlert,
    raiseIssue,
    updateActivity,
    registerFCMToken,
} = require('../controllers/deliveryPartnerSupportController.js');

// Dashboard & Orders
router.get('/dashboard', protect, role('deliveryPartner'), getDashboard);
router.get('/my-orders', protect, role('deliveryPartner'), getMyOrders);
router.get('/order/:orderId', protect, role('deliveryPartner'), getOrderDetails);

// Delivery Actions
router.post('/confirm-pickup/:orderId', protect, role('deliveryPartner'), confirmPickup);
router.post('/start-navigation/:orderId', protect, role('deliveryPartner'), startNavigation);
router.post('/confirm-cod/:orderId', protect, role('deliveryPartner'), confirmCOD);
router.post(
    '/upload-delivery-photo/:orderId',
    protect,
    role('deliveryPartner'),
    upload.single('deliveryPhoto'),
    uploadDeliveryPhotoAndComplete
);
router.post(
    '/request-replacement/:orderId',
    protect,
    role('deliveryPartner'),
    upload.single('replacementPhoto'),
    requestReplacement
);

// History & Profile
router.get('/history', protect, role('deliveryPartner'), getHistory);
router.get('/profile', protect, role('deliveryPartner'), getProfile);
router.put('/profile', protect, role('deliveryPartner'), updateProfile);

// Device Management
router.get('/devices', protect, role('deliveryPartner'), getDevices);
router.post('/logout-all', protect, role('deliveryPartner'), logoutAllDevices);

// Support & Safety
router.post('/emergency-alert', protect, role('deliveryPartner'), sendEmergencyAlert);
router.post('/raise-issue/:orderId', protect, role('deliveryPartner'), raiseIssue);

// Activity & Notifications
router.post('/update-activity', protect, role('deliveryPartner'), updateActivity);
router.post('/register-fcm', protect, role('deliveryPartner'), registerFCMToken);

module.exports = router;
