const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'USER_BANNED', 
      'USER_UNBANNED', 
      'USER_SHADOWBANNED',
      'USER_WARNED',
      'VIDEO_APPROVED', 
      'VIDEO_DELETED',
      'VIDEO_REJECTED', 
      'FEEDBACK_RESOLVED',
      'SITE_CONFIG_UPDATED',
      'EVENT_WINNER_SET',
      'EVENT_REQUEST_APPROVED',
      'EVENT_REQUEST_REJECTED',
      'EVENT_JOIN_REQUEST_APPROVED',
      'EVENT_JOIN_REQUEST_REJECTED',
      'USER_BADGE_GRANTED',
      'USER_XP_GRANTED',
      'USER_ROLE_UPDATED'
    ]
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['User', 'Video', 'Contact', 'SiteConfig', 'Event', 'System']
  },
  reason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 31536000
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
