const jwt = require('jsonwebtoken');

const resolveJwtSecret = () => {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET || null;
};

// Attaches req.user when a valid Bearer token is present but never blocks the
// request otherwise - for routes that serve both an anonymous preview and a
// fuller authenticated response (e.g. hardware compatibility checks).
const optionalAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const jwtSecret = resolveJwtSecret();

  if (token && jwtSecret) {
    try {
      req.user = jwt.verify(token, jwtSecret);
    } catch (err) {
      // Invalid/expired token - proceed as anonymous rather than blocking.
    }
  }

  next();
};

module.exports = optionalAuthMiddleware;
