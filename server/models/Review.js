const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    username: { type: String, required: true },
    rawgId: { type: Number, required: true, index: true },
    rawgSlug: { type: String },
    gameTitle: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

// One review per user per game (re-submitting updates it), fast per-game listing.
reviewSchema.index({ userId: 1, rawgId: 1 }, { unique: true });
reviewSchema.index({ rawgId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
