const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
require('dotenv').config();

const seedLocalDB = async () => {
  try {
    console.log('Connecting to Local MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/riceMillDB');
    console.log('✅ Connected to Local DB');

    // Wipe existing
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    console.log('🧹 Cleared existing local data');

    // Create Admin User
    const adminUser = new User({
      name: 'Admin Local',
      email: 'admin@local.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });
    await adminUser.save();
    console.log('✅ Created Admin User (admin@local.com / password123)');

    // Create Dummy Products
    const products = [
      {
        name: 'Premium Basmati Rice',
        description: 'High quality long grain basmati rice perfect for biryani.',
        price: 1200,
        originalPrice: 1500,
        category: 'Basmati',
        brand: 'RiceExpress',
        stock: 50,
        unit: 'kg',
        weight: 25,
        images: ['/uploads/default_rice.jpg'],
        seller: adminUser._id,
        isApproved: true,
        isActive: true
      },
      {
        name: 'Sona Masoori Rice',
        description: 'Lightweight and aromatic, perfect for daily meals.',
        price: 800,
        originalPrice: 1000,
        category: 'Raw Rice',
        brand: 'RiceExpress',
        stock: 100,
        unit: 'kg',
        weight: 25,
        images: ['/uploads/default_rice.jpg'],
        seller: adminUser._id,
        isApproved: true,
        isActive: true
      }
    ];
    
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} dummy products`);

    console.log('\n🎉 Local Database successfully seeded! You can now test the app.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedLocalDB();
