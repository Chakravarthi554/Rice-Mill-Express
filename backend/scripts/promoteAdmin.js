const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const promoteUser = async (email) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📦 Connected to MongoDB');

        const result = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { $set: { role: 'admin' } },
            { new: true }
        );

        if (result) {
            console.log(`✅ SUCCESS: User ${email} has been promoted to ADMIN.`);
            console.log(`User ID: ${result._id}`);
        } else {
            console.log(`❌ ERROR: No user found with email: ${email}`);
        }

    } catch (error) {
        console.error('❌ Connection Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

// Use command line argument
const emailArg = process.argv[2];

if (!emailArg) {
    console.log('Usage: node promoteAdmin.js <user_email>');
    process.exit();
}

promoteUser(emailArg);
