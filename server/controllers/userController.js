const User = require('../models/User');
const Game = require('../models/Game');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;

    if (req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, bio, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findById(req.params.id).select('+password');

    const isPasswordMatch = await user.matchPassword(oldPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password');
    const totalGames = await Game.countDocuments({ createdBy: userId });
    const recentGames = await Game.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const genres = await Game.aggregate([
      { $match: { createdBy: require('mongoose').Types.ObjectId(userId) } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
    ]);

    res.json({
      user,
      stats: {
        totalGames,
        averageRating:
          recentGames.length > 0
            ? (recentGames.reduce((sum, g) => sum + g.rating, 0) / recentGames.length).toFixed(2)
            : 0,
      },
      recentGames,
      genreBreakdown: genres,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
