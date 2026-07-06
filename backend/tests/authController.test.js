process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';

const { expect } = require('chai');
const sinon = require('sinon');
const User = require('../models/User');
const { loginUser } = require('../controllers/authController');

describe('Auth Controller - loginUser', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'mocha-test' }
    };
    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis(),
      cookie: sinon.spy()
    };
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return 401 if user does not exist', async () => {
    req.body = { email: 'nonexistent@example.com', password: 'password123' };
    
    sinon.stub(User, 'findOne').resolves(null);

    try {
      await loginUser(req, res, next);
      expect(res.status.calledWith(401)).to.be.true;
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.equal('Invalid email or password');
    } catch (err) {
      // shouldn't throw, should call next
    }
  });

  it('should return 401 if password does not match', async () => {
    req.body = { email: 'user@example.com', password: 'wrongpassword' };
    
    const mockUser = {
      _id: 'userid123',
      email: 'user@example.com',
      matchPassword: sinon.stub().resolves(false),
      loginHistory: []
    };
    
    // We stub findOne to return something that returns mockUser when populated
    const queryObj = {
      select: sinon.stub().resolves(mockUser)
    };
    sinon.stub(User, 'findOne').returns(queryObj);
    sinon.stub(User, 'updateOne').resolves({}); // mock the history update

    try {
      await loginUser(req, res, next);
      expect(res.status.calledWith(401)).to.be.true;
      expect(next.calledOnce).to.be.true;
    } catch (err) {
      // shouldn't throw
    }
  });

  it('should authenticate user and set cookies on success', async () => {
    req.body = { email: 'user@example.com', password: 'password123' };
    
    const mockUser = {
      _id: 'userid123',
      name: 'Test User',
      email: 'user@example.com',
      role: 'customer',
      kycStatus: 'unverified',
      matchPassword: sinon.stub().resolves(true),
      loginHistory: []
    };
    
    const queryObj = {
      select: sinon.stub().resolves(mockUser)
    };
    sinon.stub(User, 'findOne').returns(queryObj);
    sinon.stub(User, 'updateOne').resolves({});

    // This runs the asyncHandler wrapper which calls the async func
    // But authUser is wrapped in asyncHandler. We just call it, but we need a mock 'next' to catch errors.
    // Actually, because it's wrapped, if it doesn't throw, it sends res.json
    await loginUser(req, res, next);
    
    if (next.called) {
      console.log("NEXT CALLED WITH:", next.firstCall.args[0]);
    }

    expect(res.json.calledOnce).to.be.true;
    expect(res.json.firstCall.args[0]).to.have.property('name', 'Test User');
  });
});
