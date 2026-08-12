const User = require('../models/User');
const notify = require('./notify');

const ensureBadge = (user, badge) => {
  if (!Array.isArray(user.badges)) user.badges = [];
  const exists = user.badges.some((b) => b.key === badge.key || b.name === badge.name);
  if (!exists) {
    user.badges.push({
      key: badge.key,
      name: badge.name,
      tier: badge.tier || 'minor',
      description: badge.description || '',
      awardedAt: new Date(),
    });
    return true;
  }
  return false;
};

// Grants a badge by donor email (used by payment webhooks, where the donor
// identifies themselves by the email they paid with, not a userId). Returns
// null if no matching account exists - donors don't have to have an account.
const grantBadgeToUserByEmail = async ({ email, badge, notifyType, notifyTitle, notifyMessage }) => {
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
  if (!user) return null;

  const added = ensureBadge(user, badge);
  if (added) {
    await user.save();
    if (notifyType) {
      notify({ userId: user._id, type: notifyType, title: notifyTitle, message: notifyMessage, link: '/profile' });
    }
  }
  return { granted: added, user };
};

module.exports = { ensureBadge, grantBadgeToUserByEmail };
