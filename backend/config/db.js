const mongoose = require('mongoose');

const connectDB = async () => {
  // ✅ Connection timeout options so Atlas failures fail fast
  const options = {
    serverSelectionTimeoutMS: 8000,  // Give up selecting a server after 8s
    connectTimeoutMS: 10000,          // Give up on initial connection after 10s
    socketTimeoutMS: 45000,           // Close sockets after 45s of inactivity
  };

  try {
    // Check if MONGO_URI is available
    if (!process.env.MONGO_URI) {
      console.warn('⚠️ MONGO_URI not defined in environment variables; attempting local MongoDB directly');
      if (process.env.MONGO_URI_LOCAL) {
        const localConn = await mongoose.connect(process.env.MONGO_URI_LOCAL, options);
        console.log(`✅ Connected directly to local MongoDB at ${localConn.connection.host}`);
        return; // Exit early since we connected locally
      } else {
        throw new Error('Neither MONGO_URI nor MONGO_URI_LOCAL is defined');
      }
    }

    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    
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
    console.warn(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Provide helpful error messages
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n🔧 Troubleshooting Tips:');
      console.log('1. Check if your MongoDB Atlas cluster is running');
      console.log('2. ⚠️  IMPORTANT: Whitelist your IP in MongoDB Atlas:');
      console.log('   → Go to: Atlas > Network Access > Add IP Address');
      console.log('   → Add your current IP or 0.0.0.0/0 (allow all) for development');
      console.log('3. Check your MONGO_URI connection string in .env file');
      console.log('4. Ensure your internet connection is stable');
      console.log('5. If using local MongoDB, make sure MongoDB service is running');
    }
    
    // Attempt fallback to local MongoDB if Atlas connection fails
    if (error.name === 'MongooseServerSelectionError' && process.env.MONGO_URI_LOCAL) {
      console.log('⚡ Attempting fallback to local MongoDB...');
      try {
        const localConn = await mongoose.connect(process.env.MONGO_URI_LOCAL, options);
        console.log(`✅ Connected to local MongoDB at ${localConn.connection.host}`);
      } catch (localErr) {
        console.error('❌ Local MongoDB fallback failed:', localErr.message);
        process.exit(1);
      }
    } else {
      console.error('❌ Both Atlas and local MongoDB connections failed. Continuing without DB.');
    }
  }
};

module.exports = connectDB;