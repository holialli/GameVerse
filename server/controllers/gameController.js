const Game = require('../models/Game');

const curatedTrendingGames = [
  {
    rawgId: 1000001,
    rawgSlug: 'fortnite',
    title: 'Fortnite',
    description: 'Free-to-play battle royale with zero-build, creative maps, and seasonal events.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg',
    genre: 'Battle Royale',
    rating: 8.6,
    platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'],
    released: '2017-07-21',
    source: 'Curated',
  },
  {
    rawgId: 1000002,
    rawgSlug: 'call-of-duty-warzone',
    title: 'Call of Duty: Warzone',
    description: 'Large-scale competitive shooter with squad tactics and live seasonal updates.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7d.jpg',
    genre: 'Shooter',
    rating: 8.1,
    platforms: ['PC', 'PlayStation', 'Xbox'],
    released: '2020-03-10',
    source: 'Curated',
  },
  {
    rawgId: 1000003,
    rawgSlug: 'valorant',
    title: 'VALORANT',
    description: 'Tactical hero shooter focused on precision gunplay and utility mastery.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2k7f.jpg',
    genre: 'Tactical Shooter',
    rating: 8.7,
    platforms: ['PC'],
    released: '2020-06-02',
    source: 'Curated',
  },
  {
    rawgId: 1000004,
    rawgSlug: 'elden-ring',
    title: 'Elden Ring',
    description: 'Open-world action RPG with intense boss encounters and deep build variety.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
    genre: 'Action RPG',
    rating: 9.6,
    platforms: ['PC', 'PlayStation', 'Xbox'],
    released: '2022-02-25',
    source: 'Curated',
  },
  {
    rawgId: 1000005,
    rawgSlug: 'minecraft',
    title: 'Minecraft',
    description: 'Sandbox building and survival with endless creative and multiplayer options.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg',
    genre: 'Sandbox',
    rating: 9.0,
    platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'],
    released: '2011-11-18',
    source: 'Curated',
  },
  {
    rawgId: 1000006,
    rawgSlug: 'grand-theft-auto-v',
    title: 'Grand Theft Auto V',
    description: 'Open-world action epic with a massive online ecosystem.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1ntf.jpg',
    genre: 'Action Adventure',
    rating: 9.5,
    platforms: ['PC', 'PlayStation', 'Xbox'],
    released: '2013-09-17',
    source: 'Curated',
  },
];

const addCuratedFallbacks = (results, query) => {
  const q = String(query || '').toLowerCase();
  const current = [...results];
  const existingTitles = new Set(current.map((g) => String(g.title || '').toLowerCase()));

  const matchedCurated = curatedTrendingGames.filter((g) => {
    if (!q) return true;
    return g.title.toLowerCase().includes(q) || g.genre.toLowerCase().includes(q);
  });

  matchedCurated.forEach((g) => {
    if (!existingTitles.has(g.title.toLowerCase())) current.push(g);
  });

  if (q.includes('fortnite') && !current.some((g) => String(g.title || '').toLowerCase() === 'fortnite')) {
    current.unshift(curatedTrendingGames[0]);
  }

  return current.slice(0, 24);
};

const normalizeRawgItem = (item) => ({
  rawgId: item.id,
  rawgSlug: item.slug,
  title: item.name,
  description: item?.genres?.map((g) => g.name).join(', ') || 'No summary available yet.',
  coverUrl: item.background_image || null,
  genre: item?.genres?.[0]?.name || 'Unknown',
  rating: item.rating || null,
  popularityScore: Number(item.rating_top || 0) * Number(item.rating || 0),
  usersOverall: Number(item.ratings_count || 0),
  owner: 'Global Catalog',
  platforms: Array.isArray(item.platforms)
    ? item.platforms.map((p) => p.platform?.name).filter(Boolean)
    : [],
  released: item.released || null,
  source: 'RAWG',
});

const normalizeCheapSharkItem = (item) => ({
  rawgId: Number(item.gameID) || Number(item.steamAppID) || Math.floor(Math.random() * 100000000),
  rawgSlug: String(item.external || item.gameID || '').toLowerCase().replace(/\s+/g, '-'),
  title: item.external || 'Unknown title',
  description: 'Fetched from live internet catalog.',
  coverUrl: item.thumb || null,
  genre: 'Unknown',
  rating: Number(item.metacriticScore || 0) / 10 || null,
  popularityScore: Number(item.dealRating || 0) || 0,
  usersOverall: 0,
  owner: 'Global Catalog',
  platforms: ['PC'],
  released: null,
  source: 'CheapShark',
});

exports.searchInternetGames = async (req, res) => {
  try {
    const q = (req.query.q || req.query.search || '').trim();
    const page = Number(req.query.page || 1);

    if (!q) {
      const fallback = addCuratedFallbacks([], '');
      return res.json({
        games: fallback,
        page: 1,
        totalPages: 1,
        source: 'Curated',
      });
    }

    const rawgKey = process.env.RAWG_API_KEY;
    let results = [];

    const rawgParams = new URLSearchParams({
      search: q,
      page: String(Math.max(1, page)),
      page_size: '20',
    });

    if (rawgKey) {
      rawgParams.set('key', rawgKey);
    }

    try {
      const rawgResponse = await fetch(`https://api.rawg.io/api/games?${rawgParams.toString()}`);
      if (rawgResponse.ok) {
        const rawgData = await rawgResponse.json();
        results = Array.isArray(rawgData.results) ? rawgData.results.map(normalizeRawgItem) : [];
      }
    } catch (rawgErr) {
      // Fall through to secondary provider.
    }

    if (!results.length) {
      try {
        const cheapRes = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(q)}&limit=20`);
        if (cheapRes.ok) {
          const cheapData = await cheapRes.json();
          results = Array.isArray(cheapData) ? cheapData.map(normalizeCheapSharkItem) : [];
        }
      } catch (fallbackErr) {
        // Ignore and return empty set below.
      }
    }

    const finalResults = addCuratedFallbacks(results, q).map((game) => ({
      ...game,
      popularityScore: Number(game.popularityScore || game.rating || 0),
      usersOverall: Number(game.usersOverall || 0),
      owner: game.owner || 'Global Catalog',
    }));

    res.json({
      games: finalResults,
      page: Math.max(1, page),
      totalPages: finalResults.length ? Math.max(1, Math.ceil(finalResults.length / 20)) : 1,
      source: finalResults[0]?.source || 'none',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to search internet games' });
  }
};

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

// Hydrate AI-discovered game titles into catalog cards while preserving original order
exports.hydrateGames = async (req, res) => {
  try {
    const titles = Array.isArray(req.body?.titles) ? req.body.titles : [];
    if (!titles.length) {
      return res.status(400).json({ message: 'titles array is required' });
    }

    const normalized = titles
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter(Boolean)
      .slice(0, 30);

    if (!normalized.length) {
      return res.status(400).json({ message: 'No valid titles provided' });
    }

    const games = await Game.find({ title: { $in: normalized } })
      .select('_id title description genre rating imageUrl')
      .lean();

    const lookup = new Map(games.map((g) => [String(g.title).toLowerCase(), g]));
    const hydrated = normalized.map((title) => {
      const found = lookup.get(title.toLowerCase());
      if (!found) {
        return { title, found: false };
      }
      return { ...found, found: true };
    });

    const missingTitles = hydrated.filter((g) => !g.found).map((g) => g.title);
    if (missingTitles.length) {
      const internetLookups = await Promise.all(
        missingTitles.map(async (title) => {
          try {
            const params = new URLSearchParams({ search: title, page_size: '1' });
            const rawgKey = process.env.RAWG_API_KEY;
            if (rawgKey) params.set('key', rawgKey);

            const rawgResponse = await fetch(`https://api.rawg.io/api/games?${params.toString()}`);
            if (rawgResponse.ok) {
              const rawgData = await rawgResponse.json();
              const first = Array.isArray(rawgData.results) ? rawgData.results[0] : null;
              if (first) return { title, data: { ...normalizeRawgItem(first), found: true } };
            }

            return { title, data: null };
          } catch (err) {
            return { title, data: null };
          }
        })
      );

      const internetMap = new Map(internetLookups.filter((i) => i.data).map((i) => [i.title.toLowerCase(), i.data]));
      for (let i = 0; i < hydrated.length; i += 1) {
        if (!hydrated[i].found) {
          const internet = internetMap.get(hydrated[i].title.toLowerCase());
          if (internet) hydrated[i] = internet;
        }
      }
    }

    res.json({ games: hydrated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
