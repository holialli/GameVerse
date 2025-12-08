const Game = require('../models/Game');

// Create a game (ADMIN ONLY)
exports.createGame = async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create games' });
    }

    const { title, description, genre, releaseDate, rating, platform, developer, buyPrice = 9.99, rentPrice = 2.99 } = req.validatedBody;

    const game = await Game.create({
      title,
      description,
      genre,
      releaseDate,
      rating,
      platform,
      developer,
      buyPrice,
      rentPrice,
      imageUrl: req.file ? `/public/uploads/${req.file.filename}` : null,
      createdBy: null, // Games belong to admin catalog, not individual users
    });

    res.status(201).json({
      message: 'Game created successfully',
      game,
    });
  } catch (error) {
    console.error('Create game error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error: ' + messages.join(', ') });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get all games with filters and pagination
exports.getAllGames = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, genre, platform, sort = '-createdAt' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};
    
    if (search) {
      filter.$text = { $search: search };
    }
    if (genre) {
      filter.genre = genre;
    }
    if (platform) {
      filter.platform = platform;
    }

    let query = Game.find(filter)
      .populate('createdBy', 'name email avatar')
      .skip(skip)
      .limit(parseInt(limit));

    // Handle sort parameter (can be '-createdAt', 'createdAt', '-rating', 'rating', 'title', '-title')
    if (sort) {
      query = query.sort(sort);
    }

    const games = await query;
    const total = await Game.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      games,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single game
exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).populate('createdBy', 'name email avatar');

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update game (ADMIN ONLY)
exports.updateGame = async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update games' });
    }

    let game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const updates = req.validatedBody;
    if (req.file) {
      updates.imageUrl = `/public/uploads/${req.file.filename}`;
    }

    game = await Game.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email avatar');

    res.json({
      message: 'Game updated successfully',
      game,
    });
  } catch (error) {
    console.error('Update game error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error: ' + messages.join(', ') });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete game (ADMIN ONLY)
exports.deleteGame = async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete games' });
    }

    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    await Game.findByIdAndDelete(req.params.id);

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's games for dashboard
exports.getUserGames = async (req, res) => {
  try {
    const games = await Game.find({ createdBy: req.user.id }).sort({ createdAt: -1 });

    res.json({
      count: games.length,
      games,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
