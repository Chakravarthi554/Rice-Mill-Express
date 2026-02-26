const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const LegalPolicy = require('./models/LegalPolicy');

dotenv.config();

const policies = [
    {
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
    `
    },
    {
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
    `
    },
    {
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
    `
    }
];

const seedLegal = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding legal...');

        // Clear existing
        await LegalPolicy.deleteMany({ type: { $in: ['terms', 'privacy', 'refund'] } });

        // Insert new
        await LegalPolicy.insertMany(policies);

        console.log('✅ Legal policies seeded successfully.');
        process.exit();
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedLegal();
