const User = require('../models/User');
const { createCheckout } = require('../config/lemonSqueezy');

exports.createSubscriptionCheckout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const checkoutUrl = await createCheckout({
      email: user.email,
      customData: { userId: String(user._id) },
    });

    res.json({ checkoutUrl });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to start checkout' });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('subscriptionTier subscriptionRenewsAt').lean();
    res.json({
      subscriptionTier: user?.subscriptionTier || 'free',
      subscriptionRenewsAt: user?.subscriptionRenewsAt || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load subscription status' });
  }
};
