const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testUser = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/riceMillDB');
    console.log('Connected to local DB');

    const count = await User.countDocuments();
    console.log(`Current users in local DB: ${count}`);

    // Try to create a dummy user
    const newUser = new User({
      name: 'Test Firebase User',
      email: 'test@example.com',
      firebaseUid: 'dummy_firebase_uid_123',
      role: 'customer'
    });
    
    await newUser.save();
    console.log('Successfully created test user:', newUser._id);

    const newCount = await User.countDocuments();
    console.log(`New users count: ${newCount}`);
    
    // Clean up
    await User.deleteOne({ _id: newUser._id });
    process.exit(0);
  } catch (err) {
    console.error('Failed to create user:', err);
    process.exit(1);
  }
};

testUser();
