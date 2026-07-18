const asyncHandler = require('express-async-handler');
const LegalPolicy = require('../models/LegalPolicy');

const defaultPolicies = {
  terms: {
    type: 'terms',
    title: 'Terms of Service',
    version: '1.0.0',
    content: `
      <h2>1. Introduction</h2>
      <p>Welcome to Rice Mill App. By accessing our platform (mobile or desktop), you agree to these terms.</p>
      
      <h2>2. User Roles & Account</h2>
      <ul>
        <li><strong>Customers:</strong> Must provide accurate information for delivery.</li>
        <li><strong>Sellers:</strong> Responsible for product quality and availability.</li>
        <li><strong>Delivery Partners:</strong> Must ensure timely and safe delivery.</li>
        <li><strong>Admins:</strong> Oversee platform operations and security.</li>
      </ul>
      
      <h2>3. Usage Rules</h2>
      <p>Fraudulent activity, including fake orders or multiple fake accounts, will lead to immediate suspension. We reserve the right to modify these terms with notice.</p>
      
      <h2>4. Payments & Liability</h2>
      <p>Payments are processed via secure gateways. Liability is limited to the value of the order placed.</p>
    `,
    lastUpdated: new Date()
  },
  privacy: {
    type: 'privacy',
    title: 'Privacy Policy',
    version: '1.0.0',
    content: `
      <h2>1. Data Collection</h2>
      <p>We collect your name, email, phone, address, and order history for service improvement.</p>
      
      <h2>2. How We Use Data</h2>
      <p>Your data is used for order processing, rewards, referrals, and personalization across both mobile and desktop platforms.</p>
      
      <h2>3. Security & Storage</h2>
      <p>We use SSL encryption and secure databases. No sensitive card data is stored directly on our servers.</p>
      
      <h2>4. User Rights</h2>
      <p>Users can request data deletion or export via the Privacy & Data tab in settings.</p>
    `,
    lastUpdated: new Date()
  },
  refund: {
    type: 'refund',
    title: 'Refund & Cancellation Policy',
    version: '1.0.0',
    content: `
      <h2>1. Cancellations</h2>
      <p>Orders can be cancelled anytime before dispatch. Once dispatched, cancellation requires approval.</p>
      
      <h2>2. Refunds</h2>
      <p>Refunds are processed after verification and usually take 5-7 working days to reflect in your original payment method (UPI, Card, or Wallet).</p>
      
      <h2>3. Replacements</h2>
      <p>Damaged products can be replaced if reported within 24 hours with photo proof.</p>
    `,
    lastUpdated: new Date()
  }
};

// @desc    Get policy by type
// @route   GET /api/legal/:type
// @access  Public
const getPolicyByType = asyncHandler(async (req, res) => {
    const { type } = req.params;

    if (!['terms', 'privacy', 'refund'].includes(type)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid policy type'
        });
    }

    let policy = await LegalPolicy.findOne({ type, isActive: true });

    if (!policy) {
        policy = defaultPolicies[type];
    }

    if (!policy) {
        return res.status(404).json({
            success: false,
            message: `Policy ${type} not found`
        });
    }

    res.json({
        success: true,
        data: {
            type: policy.type,
            title: policy.title,
            content: policy.content,
            version: policy.version,
            lastUpdated: policy.lastUpdated
        }
    });
});

// @desc    Update policy (Admin Only)
// @route   PUT /api/legal/:type
// @access  Private/Admin
const updatePolicy = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { content, title, version, isActive } = req.body;

    let policy = await LegalPolicy.findOne({ type });

    if (policy) {
        policy.content = content || policy.content;
        policy.title = title || policy.title;
        policy.version = version || policy.version;
        policy.isActive = isActive !== undefined ? isActive : policy.isActive;
        await policy.save();
    } else {
        policy = await LegalPolicy.create({
            type,
            title,
            content,
            version,
            isActive
        });
    }

    res.json({
        success: true,
        data: policy
    });
});

module.exports = {
    getPolicyByType,
    updatePolicy
};
