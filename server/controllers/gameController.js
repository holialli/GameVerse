const Game = require('../models/Game');

// Create a game
exports.createGame = async (req, res) => {
  try {
    const { title, description, genre, releaseDate, rating, platform, developer } = req.validatedBody;

    const game = await Game.create({
      title,
      description,
      genre,
      releaseDate,
      rating,
      platform,
      developer,
      imageUrl: req.file ? `/public/uploads/${req.file.filename}` : null,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: 'Game created successfully',
      game,
    });
  } catch (error) {
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

// Update game
exports.updateGame = async (req, res) => {
  try {
    let game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check ownership
    if (game.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this game' });
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
    res.status(500).json({ message: error.message });
  }
};

// Delete game
exports.deleteGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check ownership
    if (game.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this game' });
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
