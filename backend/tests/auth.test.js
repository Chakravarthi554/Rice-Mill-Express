// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth API', () => {
  beforeAll(async () => {
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'customer'
    });
  });

  test('POST /api/auth/login - success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});