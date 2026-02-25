import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Fail loudly at startup if secrets are missing or too weak
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET env var is missing or too short (min 32 chars). Set it in backend/.env or Vercel env settings.');
}
if (!REFRESH_SECRET || REFRESH_SECRET.length < 32) {
  throw new Error('REFRESH_SECRET env var is missing or too short (min 32 chars). Set it in backend/.env or Vercel env settings.');
}

export const generateAccessToken = (userId, email, role) => {
  const payload = {
    userId,
    email,
    role,
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

export const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh',
  };

  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};

// Generate both tokens as a pair
export const generateTokenPair = (userId, email, role) => {
  return {
    accessToken: generateAccessToken(userId, email, role),
    refreshToken: generateRefreshToken(userId),
  };
};

// Legacy support - generates access token (for backward compatibility)
export const generateToken = (userId, email, role) => {
  return generateAccessToken(userId, email, role);
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};
