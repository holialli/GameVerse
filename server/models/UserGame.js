const mongoose = require('mongoose');

const userGameSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rawgId: { type: Number, required: true },
  rawgSlug: { type: String },
  title: { type: String, required: true },
  coverUrl: { type: String },
  status: {
    type: String,
    enum: ['library', 'watchlist', 'completed', 'dropped'],
    default: 'library'
  },
  inProgress: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 10 },
  playtimeMinutes: { type: Number, default: 0 },
  sessionsCount: { type: Number, default: 0 },
  lastPlayedAt: { type: Date },
  addedAt: { type: Date, default: Date.now },
  notes: { type: String, maxlength: 1000 }
});

userGameSchema.index({ userId: 1, rawgId: 1 }, { unique: true });

module.exports = mongoose.model('UserGame', userGameSchema);
