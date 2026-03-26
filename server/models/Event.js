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
