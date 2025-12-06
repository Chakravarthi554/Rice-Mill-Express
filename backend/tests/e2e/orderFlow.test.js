// backend/tests/e2e/orderFlow.test.js
const request = require('supertest');
const app = require('../../app');
const Order = require('../../models/Order');
const User = require('../../models/User');

let testOrder, authToken;

beforeAll(async () => {
  // Setup test user
  const user = await User.create({
    name: 'Test User',
    email: 'test@orderflow.com',
    password: 'password123'
  });

  // Login to get token
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@orderflow.com', password: 'password123' });
  
  authToken = res.body.token;
});

test('Complete order lifecycle', async () => {
  // 1. Create order
  const orderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ /* order data */ });
  
  testOrder = orderRes.body;

  // 2. Process order (admin action)
  await request(app)
    .put(`/api/admin/orders/${testOrder._id}/process`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  // 3. Verify status
  const updatedOrder = await Order.findById(testOrder._id);
  expect(updatedOrder.status).toBe('PROCESSING');
});