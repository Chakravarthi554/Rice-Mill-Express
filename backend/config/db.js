const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // ✅ FIXED: Remove deprecated options that cause warnings
    const options = {
      // No deprecated options - using modern defaults
    };

    // Check if MONGO_URI is available
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not defined in environment variables');
      console.log('💡 Please check your .env file and ensure MONGO_URI is set');
      process.exit(1);
    }

    console.log('🔄 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log(`✅ MongoDB Connected to ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔴 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // ✅ FIXED: Handle model compilation warnings
    mongoose.set('debug', false); // Disable debug mode to reduce noise

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Provide helpful error messages
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n🔧 Troubleshooting Tips:');
      console.log('1. Check if your MongoDB Atlas cluster is running');
      console.log('2. Verify your IP address is whitelisted in MongoDB Atlas');
      console.log('3. Check your MONGO_URI connection string in .env file');
      console.log('4. Ensure your internet connection is stable');
      console.log('5. If using local MongoDB, make sure MongoDB service is running');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;