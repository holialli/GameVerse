const express = require('express');
const router = express.Router();
const { grantBadgeToUserByEmail } = require('../utils/badgeGrants');
const { verifyWebhookSignature } = require('../config/lemonSqueezy');
const User = require('../models/User');
const ApiClient = require('../models/ApiClient');
const notify = require('../utils/notify');
const { sendSubscriptionEmail } = require('../services/emailService');

// Ko-fi posts application/x-www-form-urlencoded with a single `data` field
// containing a JSON string. Already covered by the global express.urlencoded()
// in app.js, so no special body parsing needed here.
router.post('/kofi', async (req, res) => {
  try {
    const payload = JSON.parse(req.body.data || '{}');

    if (!process.env.KOFI_VERIFICATION_TOKEN || payload.verification_token !== process.env.KOFI_VERIFICATION_TOKEN) {
      return res.status(401).json({ message: 'Invalid verification token' });
    }

    if (payload.email) {
      await grantBadgeToUserByEmail({
        email: payload.email,
        badge: { key: 'supporter', name: 'Supporter', tier: 'major', description: 'Supports GameVerse development.' },
        notifyType: 'supporter_granted',
        notifyTitle: 'Thank you for supporting GameVerse!',
        notifyMessage: 'Your Supporter badge has been added to your profile.',
      });
    }

    res.status(200).json({ message: 'ok' });
  } catch (err) {
    console.error('[WEBHOOK] Ko-fi processing error:', err.message);
    res.status(500).json({ message: 'Failed to process webhook' });
  }
});

// Shared by both the developer-API paid-tier upgrade (Phase 4.7) and the
// end-user premium subscription (Phase 5.1) - custom_data (set at checkout
// creation time) tells us which one a given subscription belongs to.
const ACTIVE_STATUSES = ['active', 'on_trial'];

router.post('/lemonsqueezy', async (req, res) => {
  try {
    const signature = req.headers['x-signature'];
    if (!verifyWebhookSignature(req.rawBody, signature)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const eventName = req.body?.meta?.event_name;
    const customData = req.body?.meta?.custom_data || {};
    const attributes = req.body?.data?.attributes || {};
    const subscriptionId = req.body?.data?.id;
    const isActive = ACTIVE_STATUSES.includes(attributes.status);

    const isLifecycleEvent = [
      'subscription_created',
      'subscription_updated',
      'subscription_resumed',
      'subscription_cancelled',
      'subscription_expired',
    ].includes(eventName);

    if (isLifecycleEvent && customData.apiClientId) {
      const apiClient = await ApiClient.findById(customData.apiClientId);
      if (apiClient) {
        apiClient.plan = isActive ? 'paid' : 'free';
        apiClient.monthlyLimit = isActive ? 20000 : 1000;
        apiClient.lemonSqueezyCustomerId = String(attributes.customer_id || '');
        apiClient.lemonSqueezySubscriptionId = subscriptionId || null;
        await apiClient.save();
      }
    } else if (isLifecycleEvent && customData.userId) {
      const user = await User.findById(customData.userId);
      if (user) {
        const wasActive = user.subscriptionTier === 'premium';
        user.subscriptionTier = isActive ? 'premium' : 'free';
        user.lemonSqueezyCustomerId = String(attributes.customer_id || '');
        user.lemonSqueezySubscriptionId = subscriptionId || null;
        user.subscriptionRenewsAt = attributes.renews_at ? new Date(attributes.renews_at) : null;
        await user.save();

        if (isActive && !wasActive) {
          notify({
            userId: user._id,
            type: 'subscription_started',
            title: 'Welcome to GameVerse Premium!',
            message: 'Unlimited AI queries, multiple hardware profiles, and profile cosmetics are now unlocked.',
            link: '/profile',
          });
          sendSubscriptionEmail(user.email, user.name, 'Active').catch((err) => console.error('Email error:', err));
        } else if (isActive && wasActive) {
          notify({
            userId: user._id,
            type: 'subscription_renewed',
            title: 'Subscription renewed',
            message: 'Your GameVerse Premium subscription has renewed.',
            link: '/profile',
          });
        }
      }
    }

    res.status(200).json({ message: 'ok' });
  } catch (err) {
    console.error('[WEBHOOK] Lemon Squeezy processing error:', err.message);
    res.status(500).json({ message: 'Failed to process webhook' });
  }
});

module.exports = router;
