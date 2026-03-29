const Game = require('../models/Game');

const RAWG_GENRE_SLUG_MAP = {
  action: 'action',
  adventure: 'adventure',
  rpg: 'role-playing-games-rpg',
  shooter: 'shooter',
  sports: 'sports',
  strategy: 'strategy',
  simulation: 'simulation',
  racing: 'racing',
  puzzle: 'puzzle',
  indie: 'indie',
  casual: 'casual',
  fighting: 'fighting',
  platformer: 'platformer',
  horror: 'horror',
  'battle royale': 'shooter',
  sandbox: 'simulation',
};

const RAWG_PLATFORM_ID_MAP = {
  pc: '4',
  playstation: '187,18,16,15,27,19,17',
  xbox: '186,1,14,80',
  'nintendo switch': '7',
  nintendo: '7,8,9,13,10,11,105,83,24,43,26',
  mobile: '3,21',
  'steam deck': '4',
  linux: '6',
  macos: '5',
};

const normalizeFilterValue = (value) => String(value || '').trim().toLowerCase();

const toRawgGenreSlug = (genre) => {
  const normalized = normalizeFilterValue(genre);
  if (!normalized) return '';
  if (RAWG_GENRE_SLUG_MAP[normalized]) return RAWG_GENRE_SLUG_MAP[normalized];
  return normalized.replace(/\s+/g, '-');
};

const toRawgPlatformIds = (platform) => {
  const normalized = normalizeFilterValue(platform);
  if (!normalized) return '';
  if (RAWG_PLATFORM_ID_MAP[normalized]) return RAWG_PLATFORM_ID_MAP[normalized];
  return normalized;
};

const normalizeRawgItem = (item, isFullDetail = false) => {
  // Extract publisher/developer from RAWG data
  // Full detail responses have publishers/developers arrays
  const publishers = Array.isArray(item.publishers) ? item.publishers.map(p => p.name).join(', ') : null;
  const developers = Array.isArray(item.developers) ? item.developers.map(d => d.name).join(', ') : null;
  const owner = publishers || developers || 'Global Catalog';
  
  return {
    rawgId: item.id,
    rawgSlug: item.slug,
    title: item.name,
    description: item?.genres?.map((g) => g.name).join(', ') || 'No summary available yet.',
    coverUrl: item.background_image || null,
    genre: item?.genres?.[0]?.name || 'Unknown',
    rating: item.rating || null,
    popularityScore: Number(item.rating_top || 0) * Number(item.rating || 0),
    usersOverall: Number(item.ratings_count || 0),
    owner,
    platforms: Array.isArray(item.platforms)
      ? item.platforms.map((p) => p.platform?.name).filter(Boolean)
      : [],
    released: item.released || null,
    source: 'RAWG',
  };
};

exports.searchInternetGames = async (req, res) => {
  try {
    const q = (req.query.q || req.query.search || '').trim();
    const genreQuery = String(req.query.genre || '').trim().toLowerCase();
    const platformQuery = String(req.query.platform || '').trim().toLowerCase();
    const page = Number(req.query.page || 1);

    const rawgKey = process.env.RAWG_API_KEY;
    let results = [];
    let rawgTotalCount = 0;
    let warning = '';

    const rawgParams = new URLSearchParams({
      page: String(Math.max(1, page)),
      page_size: '10',
      ordering: q ? '-rating' : '-added',
    });

    if (q) {
      rawgParams.set('search', q);
    }

    const rawgGenre = toRawgGenreSlug(genreQuery);
    const rawgPlatforms = toRawgPlatformIds(platformQuery);

    if (rawgGenre) {
      if (rawgGenre === 'horror') {
        // RAWG's top-level genre list can be inconsistent for horror. Tags are more reliable.
        rawgParams.set('tags', 'horror');
      } else {
        rawgParams.set('genres', rawgGenre);
      }
    }
    if (rawgPlatforms) {
      rawgParams.set('platforms', rawgPlatforms);
    }

    if (rawgKey) {
      rawgParams.set('key', rawgKey);
    } else {
      warning = 'Live game catalog is temporarily unavailable.';
    }

    try {
      console.log(`[GAMES] Searching RAWG for query: "${q}"`);
      const rawgResponse = await fetch(`https://api.rawg.io/api/games?${rawgParams.toString()}`);
      if (rawgResponse.ok) {
        const rawgData = await rawgResponse.json();
        rawgTotalCount = Number(rawgData?.count || 0);
        console.log(`[GAMES] RAWG returned ${rawgData.results?.length || 0} results for "${q}"`);
        
        // Fetch full details for top 3 results to get publisher/developer info
        if (Array.isArray(rawgData.results) && rawgData.results.length > 0) {
          const topResults = rawgData.results.slice(0, 3);
          const enrichedResults = [];
          
          for (const searchResult of topResults) {
            try {
              const detailUrl = `https://api.rawg.io/api/games/${searchResult.id}?key=${rawgKey}`;
              const detailResponse = await fetch(detailUrl);
              if (detailResponse.ok) {
                const fullGame = await detailResponse.json();
                console.log(`[GAMES] Fetched full details for ${searchResult.name} - Publishers: ${fullGame.publishers?.map(p => p.name).join(', ') || 'none'}`);
                enrichedResults.push(normalizeRawgItem(fullGame, true));
              } else {
                enrichedResults.push(normalizeRawgItem(searchResult));
              }
            } catch (err) {
              console.warn(`[GAMES] Failed to fetch details for ${searchResult.id}:`, err.message);
              enrichedResults.push(normalizeRawgItem(searchResult));
            }
          }
          
          // Append remaining search results without enrichment
          results = [
            ...enrichedResults,
            ...rawgData.results.slice(3).map(r => normalizeRawgItem(r))
          ];
        } else {
          results = Array.isArray(rawgData.results) ? rawgData.results.map(r => normalizeRawgItem(r)) : [];
        }
      } else {
        console.error(`[GAMES] RAWG API error: ${rawgResponse.status} ${rawgResponse.statusText}`);
        if (!warning) {
          warning = 'Live game catalog is temporarily unavailable.';
        }
      }
    } catch (rawgErr) {
      console.error('[GAMES] Error fetching from RAWG:', rawgErr.message);
      if (!warning) {
        warning = 'Live game catalog is temporarily unavailable.';
      }
    }

    const normalizedQuery = q.toLowerCase();
    const finalResults = results.map((game) => ({
      ...game,
      popularityScore: Number(game.popularityScore || game.rating || 0),
      usersOverall: Number(game.usersOverall || 0),
      owner: game.owner || 'Global Catalog',
    }))
      .sort((a, b) => {
        const aTitle = String(a.title || '').toLowerCase();
        const bTitle = String(b.title || '').toLowerCase();
        const aExact = normalizedQuery && (aTitle === normalizedQuery || aTitle.startsWith(normalizedQuery));
        const bExact = normalizedQuery && (bTitle === normalizedQuery || bTitle.startsWith(normalizedQuery));
        if (aExact !== bExact) return bExact ? 1 : -1;
        return Number(b.popularityScore || 0) - Number(a.popularityScore || 0);
      })
      .slice(0, 10);

    res.json({
      games: finalResults,
      page: Math.max(1, page),
      totalPages: rawgTotalCount ? Math.max(1, Math.ceil(rawgTotalCount / 10)) : 1,
      source: finalResults[0]?.source || 'none',
      warning,
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
