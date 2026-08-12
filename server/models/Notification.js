const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['welcome', 'badge_earned', 'purchase', 'rental', 'event_approved', 'event_join_approved', 'supporter_granted', 'subscription_started', 'subscription_renewed', 'api_key_issued'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  link: { type: String, default: null },
  read: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7776000, // 90 days
  },
});

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
