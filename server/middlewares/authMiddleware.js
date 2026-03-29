const jwt = require('jsonwebtoken');

const resolveJwtSecret = () => {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET || null;
};

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token
    const jwtSecret = resolveJwtSecret();

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    if (!jwtSecret) {
      return res.status(503).json({ message: 'Auth service temporarily unavailable' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Auth error' });
  }
};

module.exports = authMiddleware;
