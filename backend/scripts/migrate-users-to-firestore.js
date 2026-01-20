/**
 * Migrate existing MongoDB users to Firestore
 * Run this once to sync all existing users
 * 
 * Usage: node scripts/migrate-users-to-firestore.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const firebaseUserSync = require('../services/firebaseUserSync');
require('dotenv').config();

async function migrateUsers() {
    console.log('🚀 Starting user migration to Firestore...\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all users
        const users = await User.find({});
        console.log(`📊 Found ${users.length} users to migrate\n`);

        if (users.length === 0) {
            console.log('⚠️  No users found to migrate');
            process.exit(0);
        }

        // Show user breakdown by role
        const roleCount = {};
        users.forEach(user => {
            roleCount[user.role] = (roleCount[user.role] || 0) + 1;
        });

        console.log('User breakdown by role:');
        Object.entries(roleCount).forEach(([role, count]) => {
            console.log(`  - ${role}: ${count}`);
        });
        console.log('');

        // Batch sync users
        console.log('🔄 Starting batch sync...\n');
        const count = await firebaseUserSync.batchSyncUsers(users);

        console.log('\n✅ Migration complete!');
        console.log(`📦 Total users migrated: ${count}`);
        console.log('\nNext steps:');
        console.log('1. Go to Firebase Console → Firestore');
        console.log('2. Check "users" collection');
        console.log('3. Verify user documents created');
        console.log('4. Update Firebase rules if needed\n');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration error:', error.message);
        console.error('\nStack trace:');
        console.error(error);

        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run migration
migrateUsers();
