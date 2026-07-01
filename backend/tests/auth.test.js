// backend/tests/auth.test.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');
const User = require('../models/User');

describe('Auth API', () => {
  before(async () => {
    await User.deleteMany({ email: 'test@example.com' });
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'customer'
    });
  });

  after(async () => {
    await User.deleteMany({ email: 'test@example.com' });
  });

  it('POST /api/auth/login - success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('accessToken');
  });
});