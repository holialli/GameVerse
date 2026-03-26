const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrators only.' });
    }

    const liveUser = await User.findById(req.user.id).select('role');
    if (!liveUser || liveUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Role validation failed.' });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Admin validation failed' });
  }
};

module.exports = requireAdmin;
