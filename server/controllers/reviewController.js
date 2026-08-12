const Review = require('../models/Review');
const User = require('../models/User');

exports.getReviewsForGame = async (req, res) => {
  try {
    const rawgId = Number(req.params.rawgId);
    if (!Number.isFinite(rawgId)) return res.status(400).json({ message: 'Invalid game id' });

    const reviews = await Review.find({ rawgId }).sort({ createdAt: -1 }).limit(100).lean();
    const avgRating = reviews.length
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(2))
      : null;

    res.json({ reviews, count: reviews.length, avgRating });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load reviews' });
  }
};

exports.upsertReview = async (req, res) => {
  try {
    const rawgId = Number(req.params.rawgId);
    if (!Number.isFinite(rawgId)) return res.status(400).json({ message: 'Invalid game id' });

    const { rating, text, rawgSlug, gameTitle } = req.validatedBody;

    const user = await User.findById(req.user.id).select('username name');
    const username = user?.username || user?.name || 'Player';

    const review = await Review.findOneAndUpdate(
      { userId: req.user.id, rawgId },
      { $set: { rating, text: text || '', rawgSlug, gameTitle, username } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Review saved', review });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save review' });
  }
};

exports.deleteOwnReview = async (req, res) => {
  try {
    const deleted = await Review.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete review' });
  }
};
