const jwt = require('jsonwebtoken');

// 🔥 CRITICAL FIX: Enhanced token generation with proper error handling
const generateToken = (id, type = 'access') => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw new Error('REFRESH_TOKEN_SECRET is not defined in environment variables');
    }

    const secret = type === 'access' ? process.env.JWT_SECRET : process.env.REFRESH_TOKEN_SECRET;
    const expiresIn = type === 'access' ? '15m' : '7d';

    const token = jwt.sign({ id }, secret, { expiresIn });
    
    console.log(`✅ Token generated successfully - Type: ${type}, User: ${id}`);
    return token;
  } catch (error) {
    console.error('❌ Token generation failed:', error.message);
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

const generateRefreshToken = (id) => {
  return generateToken(id, 'refresh');
};

module.exports = { generateToken, generateRefreshToken };