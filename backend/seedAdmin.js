const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB Atlas connection string (replace with your owni)
const MONGODB_URI = 'mongodb+srv://riceMillUser:qVqI2DESf5nZ6MIR@cluster0.m05jbda.mongodb.net/riceMillDB?retryWrites=true&w=majority';


// Define User schema (temporary for seeding)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['seller', 'admin'], default: 'seller' },
});

const User = mongoose.model('User', userSchema);

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB Atlas');

    const adminEmail = 'admin@ricemill.com';
    const adminPassword = 'Chakri12345@'; // Change this to a secure password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await User.findOne({ email: adminEmail });
    if (adminUser) {
      console.log('Admin user already exists');
    } else {
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Admin user created successfully');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

seedAdmin();