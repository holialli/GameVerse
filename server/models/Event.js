const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Tournament', 'Showmatch', 'Community', 'Qualifier', 'Seasonal'],
      default: 'Tournament',
    },
    scheduledStartTime: { type: Date, default: null },
    scheduledEndTime: { type: Date, default: null },
    prizePool: { type: String, default: '' },
    pointsAwarded: { type: Number, default: 0 },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    joinRequests: {
      type: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
          requestedAt: { type: Date, default: Date.now },
          reviewedAt: { type: Date, default: null },
          reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        },
      ],
      default: [],
    },
    winner: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      username: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['scheduled', 'awaiting-result', 'completed'],
      default: 'scheduled',
    },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
