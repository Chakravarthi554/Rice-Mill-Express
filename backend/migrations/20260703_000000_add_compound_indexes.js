/**
 * Initial migration: Add compound indexes for query performance
 */
module.exports = {
  up: async (db) => {
    console.log('  Creating compound indexes...');
    
    // Order indexes
    await db.collection('orders').createIndex({ user: 1, orderStatus: 1 });
    await db.collection('orders').createIndex({ seller: 1, orderStatus: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });
    
    // Product indexes
    await db.collection('products').createIndex({ seller: 1, approvalStatus: 1 });
    await db.collection('products').createIndex({ category: 1, price: 1 });
    
    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ phone: 1 }, { sparse: true });
    
    console.log('  ✅ All indexes created');
  },

  down: async (db) => {
    console.log('  Dropping compound indexes...');
    
    await db.collection('orders').dropIndex('user_1_orderStatus_1').catch(() => {});
    await db.collection('orders').dropIndex('seller_1_orderStatus_1').catch(() => {});
    await db.collection('orders').dropIndex('createdAt_-1').catch(() => {});
    await db.collection('products').dropIndex('seller_1_approvalStatus_1').catch(() => {});
    await db.collection('products').dropIndex('category_1_price_1').catch(() => {});
    
    console.log('  ✅ Indexes dropped');
  }
};
