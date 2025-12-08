const Purchase = require('../models/Purchase');
const Game = require('../models/Game');
const User = require('../models/User');
const { sendGamePurchaseEmail, sendGameRentalEmail } = require('../services/emailService');

// User buys a game
exports.buyGame = async (req, res) => {
  try {
    const { gameId } = req.body;
    const userId = req.user.id;

    // Get user for email
    const user = await User.findById(userId);

    // Check if game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user already owns this game
    const existingPurchase = await Purchase.findOne({
      userId,
      gameId,
      type: 'buy',
    });
    if (existingPurchase) {
      return res.status(400).json({ message: 'You already own this game' });
    }

    // Create purchase record
    const purchase = await Purchase.create({
      userId,
      gameId,
      type: 'buy',
      price: game.buyPrice,
      expiryDate: null, // Ownership is permanent
    });

    // Send purchase confirmation email (async, don't wait)
    sendGamePurchaseEmail(user.email, user.name, game.title, game.buyPrice).catch(err =>
      console.error('Email error:', err)
    );

    // Populate game and user info
    await purchase.populate('gameId');

    res.status(201).json({
      message: 'Game purchased successfully',
      purchase,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User rents a game
exports.rentGame = async (req, res) => {
  try {
    const { gameId } = req.body;
    const userId = req.user.id;

    // Get user for email
    const user = await User.findById(userId);

    // Check if game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user already has active rental
    const activeRental = await Purchase.findOne({
      userId,
      gameId,
      type: 'rent',
      expiryDate: { $gt: new Date() }, // Not expired
    });
    if (activeRental) {
      return res.status(400).json({ message: 'You already have an active rental of this game' });
    }

    // Rental is for 7 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    // Create rental record
    const purchase = await Purchase.create({
      userId,
      gameId,
      type: 'rent',
      price: game.rentPrice,
      expiryDate,
    });

    // Send rental confirmation email (async, don't wait)
    sendGameRentalEmail(user.email, user.name, game.title, game.rentPrice, expiryDate).catch(err =>
      console.error('Email error:', err)
    );

    await purchase.populate('gameId');

    res.status(201).json({
      message: 'Game rented successfully for 7 days',
      purchase,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's purchased/rented games
exports.getUserGames = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all active purchases and rentals
    const purchases = await Purchase.find({
      userId,
      isActive: true,
    })
      .populate('gameId')
      .sort({ createdAt: -1 });

    // Separate owned vs rented
    const owned = purchases.filter(p => p.type === 'buy');
    const rented = purchases.filter(
      p => p.type === 'rent' && new Date(p.expiryDate) > new Date()
    );

    // Check for expired rentals
    const expired = purchases.filter(
      p => p.type === 'rent' && new Date(p.expiryDate) <= new Date()
    );

    res.json({
      owned,
      rented,
      expired,
      total: purchases.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Return a rented game early
exports.returnRental = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const userId = req.user.id;

    const purchase = await Purchase.findOne({
      _id: purchaseId,
      userId,
      type: 'rent',
    });

    if (!purchase) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    purchase.isActive = false;
    await purchase.save();

    res.json({
      message: 'Rental returned successfully',
      purchase,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: View all purchases (analytics)
exports.getAllPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};
    if (type) filter.type = type;

    const purchases = await Purchase.find(filter)
      .populate('userId', 'name email')
      .populate('gameId', 'title genre')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Purchase.countDocuments(filter);

    res.json({
      purchases,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
