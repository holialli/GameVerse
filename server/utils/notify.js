const Notification = require('../models/Notification');

// Fire-and-forget, same pattern as emailService sends elsewhere in the
// codebase: notification failures are logged, never allowed to break the
// request that triggered them.
const notify = async ({ userId, type, title, message = '', link = null }) => {
  try {
    await Notification.create({ userId, type, title, message, link });
  } catch (err) {
    console.error('[NOTIFY] Failed to create notification:', err.message);
  }
};

module.exports = notify;
