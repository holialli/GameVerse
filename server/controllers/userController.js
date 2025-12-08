const mongoose = require('mongoose');
const User = require('../models/User');
const Game = require('../models/Game');
const { sendPasswordChangedEmail } = require('../services/emailService');

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

    // Send password changed email (async, don't wait)
    sendPasswordChangedEmail(user.email, user.name).catch(err => console.error('Email error:', err));

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const Purchase = require('../models/Purchase');

    const user = await User.findById(userId).select('-password');
    
    // For admin: Show games created/managed
    // For regular users: Show purchased/rented games
    let dashboardData = {
      user,
      stats: {},
      purchases: [],
      rentals: [],
    };

    if (user.role === 'admin') {
      // Admin dashboard - show created games statistics
      const totalGames = await Game.countDocuments();
      const recentGames = await Game.find()
        .sort({ createdAt: -1 })
        .limit(5);

      const genres = await Game.aggregate([
        { $group: { _id: '$genre', count: { $sum: 1 } } },
      ]);

      dashboardData.stats = {
        totalGames,
        averageRating:
          recentGames.length > 0
            ? (recentGames.reduce((sum, g) => sum + g.rating, 0) / recentGames.length).toFixed(2)
            : 0,
      };
      dashboardData.recentGames = recentGames;
      dashboardData.genreBreakdown = genres;
    } else {
      // Regular user dashboard - show purchases and rentals
      const purchases = await Purchase.find({
        userId,
        type: 'buy',
        isActive: true,
      })
        .populate('gameId')
        .sort({ createdAt: -1 });

      const rentals = await Purchase.find({
        userId,
        type: 'rent',
        expiryDate: { $gt: new Date() },
        isActive: true,
      })
        .populate('gameId')
        .sort({ createdAt: -1 });

      const totalSpent = await Purchase.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]);

      dashboardData.stats = {
        totalPurchased: purchases.length,
        totalRenting: rentals.length,
        totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
      };
      dashboardData.recentPurchases = purchases.slice(0, 5);
      dashboardData.activeRentals = rentals;
    }

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
