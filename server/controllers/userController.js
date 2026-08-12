const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const UserGame = require('../models/UserGame');
const Event = require('../models/Event');
const notify = require('../utils/notify');

const notifyNewBadges = (userId, newBadges) => {
  newBadges.forEach((badge) => {
    notify({
      userId,
      type: 'badge_earned',
      title: `Badge earned: ${badge.name}`,
      message: badge.description || '',
      link: '/profile',
    });
  });
};

const BADGE_DEFINITIONS = {
  FIRST_TRACK: {
    key: 'first-track',
    name: 'First Contact',
    tier: 'minor',
    description: 'Tracked your first game.',
  },
  LIBRARY_5: {
    key: 'library-5',
    name: 'Curator I',
    tier: 'minor',
    description: 'Tracked at least 5 games.',
  },
  LIBRARY_15: {
    key: 'library-15',
    name: 'Curator II',
    tier: 'major',
    description: 'Tracked at least 15 games.',
  },
  WATCHLIST_5: {
    key: 'watchlist-5',
    name: 'Scout',
    tier: 'minor',
    description: 'Added 5 games to watchlist.',
  },
  COMPLETED_3: {
    key: 'completed-3',
    name: 'Closer',
    tier: 'minor',
    description: 'Completed 3 games.',
  },
  COMPLETED_10: {
    key: 'completed-10',
    name: 'Legend Finisher',
    tier: 'major',
    description: 'Completed 10 games.',
  },
  SESSION_25: {
    key: 'session-25',
    name: 'Session Vanguard',
    tier: 'major',
    description: 'Logged 25 play sessions.',
  },
  PLAYTIME_100H: {
    key: 'playtime-100h',
    name: 'Century Player',
    tier: 'major',
    description: 'Reached 100 hours total playtime.',
  },
  XP_2500: {
    key: 'xp-2500',
    name: 'Rising Myth',
    tier: 'major',
    description: 'Earned 2,500 XP.',
  },
  ADMIN_AEGIS: {
    key: 'admin-aegis',
    name: 'Aegis Prime',
    tier: 'super',
    description: 'Granted to platform administrators.',
  },
  ADMIN_NEXUS: {
    key: 'admin-nexus',
    name: 'Control Nexus',
    tier: 'super',
    description: 'High command access across moderation systems.',
  },
};

const hasBadge = (user, key) => Array.isArray(user.badges) && user.badges.some((b) => b.key === key || b.name === key);

const addBadge = (user, definition) => {
  if (!definition || hasBadge(user, definition.key)) return false;
  user.badges.push({
    key: definition.key,
    name: definition.name,
    tier: definition.tier,
    description: definition.description,
    awardedAt: new Date(),
  });
  return true;
};

const upsertLevelFromXP = (user) => {
  user.level = Math.max(user.level || 1, Math.floor(Math.sqrt((user.xp || 0) / 100)) + 1);
};

const ensureAdminPrestige = (user) => {
  if (user.role !== 'admin') return false;
  let changed = false;

  if ((user.xp || 0) < 15000) {
    user.xp = 15000;
    changed = true;
  }

  changed = addBadge(user, BADGE_DEFINITIONS.ADMIN_AEGIS) || changed;
  changed = addBadge(user, BADGE_DEFINITIONS.ADMIN_NEXUS) || changed;

  upsertLevelFromXP(user);
  return changed;
};

const applyAutoBadges = (user, games) => {
  const trackedCount = games.length;
  const watchlistCount = games.filter((g) => g.status === 'watchlist').length;
  const completedCount = games.filter((g) => g.status === 'completed').length;
  const sessionsCount = games.reduce((acc, g) => acc + (g.sessionsCount || 0), 0);
  const playtimeMinutes = games.reduce((acc, g) => acc + (g.playtimeMinutes || 0), 0);
  let changed = false;
  const newBadges = [];

  const tryAdd = (definition) => {
    if (addBadge(user, definition)) {
      changed = true;
      newBadges.push(definition);
    }
  };

  if (trackedCount >= 1) tryAdd(BADGE_DEFINITIONS.FIRST_TRACK);
  if (trackedCount >= 5) tryAdd(BADGE_DEFINITIONS.LIBRARY_5);
  if (trackedCount >= 15) tryAdd(BADGE_DEFINITIONS.LIBRARY_15);
  if (watchlistCount >= 5) tryAdd(BADGE_DEFINITIONS.WATCHLIST_5);
  if (completedCount >= 3) tryAdd(BADGE_DEFINITIONS.COMPLETED_3);
  if (completedCount >= 10) tryAdd(BADGE_DEFINITIONS.COMPLETED_10);
  if (sessionsCount >= 25) tryAdd(BADGE_DEFINITIONS.SESSION_25);
  if (playtimeMinutes >= 6000) tryAdd(BADGE_DEFINITIONS.PLAYTIME_100H);
  if ((user.xp || 0) >= 2500) tryAdd(BADGE_DEFINITIONS.XP_2500);

  return { changed, newBadges, trackedCount, watchlistCount, completedCount, sessionsCount, playtimeMinutes };
};

const awardXP = async (userId, amount, badgeName = null) => {
  const user = await User.findById(userId);
  if (!user) return;

  user.xp = Math.max(0, (user.xp || 0) + amount);
  upsertLevelFromXP(user);

  if (badgeName) {
    const definition = {
      key: badgeName.toLowerCase().replace(/\s+/g, '-'),
      name: badgeName,
      tier: 'minor',
      description: '',
    };
    if (addBadge(user, definition)) {
      notifyNewBadges(userId, [definition]);
    }
  }

  ensureAdminPrestige(user);

  await user.save();
};

exports.getUserProfile = async (req, res) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    let user;
    if (req.params.id === 'me' || !req.params.id) {
      user = await User.findById(req.user.id).select('-password');
    } else if (isObjectId) {
      user = await User.findById(req.params.id).select('-password');
    } else {
      user = await User.findOne({ username: req.params.id }).select('-password');
    }

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.id !== req.user.id && user.isPrivate) {
      return res.status(403).json({ message: 'This profile is private.', isPrivate: true, username: user.username });
    }

    const allGames = await UserGame.find({ userId: user.id });
    const autoResult = applyAutoBadges(user, allGames);
    ensureAdminPrestige(user);
    if (autoResult.changed) {
      await user.save();
      notifyNewBadges(user.id, autoResult.newBadges);
    }

    const topGenresMap = allGames.reduce((acc, g) => {
      const key = (g.genre || 'Unknown').trim();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topGenres = Object.entries(topGenresMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    const wins = await Event.countDocuments({ 'winner.userId': user._id });

    const totalPlaytimeMins = autoResult.playtimeMinutes;

    res.json({
      ...user.toObject(),
      stats: {
        libraryCount: autoResult.trackedCount,
        watchlistCount: autoResult.watchlistCount,
        completedCount: autoResult.completedCount,
        sessionsCount: autoResult.sessionsCount,
        totalPlaytimeHrs: Math.floor(totalPlaytimeMins / 60),
        eventsWon: wins,
        topGenres,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public, unauthenticated profile lookup for shareable /u/:username pages.
// Deliberately projects a safe, fixed field set (never email) rather than
// reusing getUserProfile's `...user.toObject()` spread, and never persists
// auto-badge calculations - this endpoint is anonymous, cacheable traffic.
exports.getPublicProfile = async (req, res) => {
  try {
    const handle = String(req.params.username || '').trim().toLowerCase();
    const user = await User.findOne({ $or: [{ username: handle }, { customSlug: handle }] }).select('-password -email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isPrivate) {
      return res.status(403).json({ message: 'This profile is private.', isPrivate: true, username: user.username });
    }

    const allGames = await UserGame.find({ userId: user.id });
    const autoResult = applyAutoBadges(user, allGames);
    const wins = await Event.countDocuments({ 'winner.userId': user._id });

    const topGenresMap = allGames.reduce((acc, g) => {
      const key = (g.genre || 'Unknown').trim();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const topGenres = Object.entries(topGenresMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    res.json({
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      level: user.level,
      xp: user.xp,
      badges: user.badges,
      profileBanner: user.profileBanner || null,
      avatarFrame: user.avatarFrame || null,
      customSlug: user.customSlug || null,
      stats: {
        libraryCount: autoResult.trackedCount,
        watchlistCount: autoResult.watchlistCount,
        completedCount: autoResult.completedCount,
        totalPlaytimeHrs: Math.floor(autoResult.playtimeMinutes / 60),
        eventsWon: wins,
        topGenres,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const AVATAR_FRAMES = ['gold', 'neon', 'pixel'];

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar, isPrivate, username, profileBanner, avatarFrame, newsletterOptIn, customSlug } = req.body;
    const idToUpdate = req.params.id === 'me' ? req.user.id : req.params.id;

    if (idToUpdate !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(idToUpdate);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = String(name).trim();
    if (bio !== undefined) user.bio = String(bio).trim();
    if (avatar !== undefined) user.avatar = String(avatar).trim();
    if (isPrivate !== undefined) user.isPrivate = Boolean(isPrivate);

    // Cosmetics are premium-only - gated here, server-side, never trusting
    // a frontend-only check (a non-premium request just silently no-ops).
    const isPremium = user.subscriptionTier === 'premium';
    if (profileBanner !== undefined && isPremium) {
      user.profileBanner = String(profileBanner).trim() || null;
    }
    if (avatarFrame !== undefined && isPremium) {
      user.avatarFrame = AVATAR_FRAMES.includes(avatarFrame) ? avatarFrame : null;
    }

    if (newsletterOptIn !== undefined) {
      user.newsletterOptIn = Boolean(newsletterOptIn);
      if (user.newsletterOptIn && !user.newsletterUnsubscribeToken) {
        user.newsletterUnsubscribeToken = crypto.randomBytes(24).toString('hex');
      }
    }

    if (username !== undefined) {
      const normalizedUsername = String(username || '').trim().toLowerCase();
      if (normalizedUsername) {
        const existing = await User.findOne({ username: normalizedUsername, _id: { $ne: idToUpdate } });
        if (existing) return res.status(409).json({ message: 'Username is already taken' });
        user.username = normalizedUsername;
      } else {
        user.username = null;
      }
    }

    if (customSlug !== undefined) {
      const normalizedSlug = String(customSlug || '').trim().toLowerCase();
      if (normalizedSlug) {
        if (!/^[a-z0-9-]{3,30}$/.test(normalizedSlug)) {
          return res.status(400).json({ message: 'Custom URL must be 3-30 characters: lowercase letters, numbers, and hyphens only.' });
        }
        const existing = await User.findOne({
          _id: { $ne: idToUpdate },
          $or: [{ customSlug: normalizedSlug }, { username: normalizedSlug }],
        });
        if (existing) return res.status(409).json({ message: 'That custom URL is already taken' });
        user.customSlug = normalizedSlug;
      } else {
        user.customSlug = null;
      }
    }

    await user.save();

    const savedUser = await User.findById(idToUpdate).select('-password');
    res.json({ message: 'Profile updated', user: savedUser });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.username) {
      return res.status(409).json({ message: 'Username is already taken' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Public, token-authenticated unsubscribe link - no login required, since
// the recipient is reading this from an email, not an active session.
exports.unsubscribeNewsletter = async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) return res.status(400).json({ message: 'Missing unsubscribe token' });

    const user = await User.findOne({ newsletterUnsubscribeToken: token });
    if (!user) return res.status(404).json({ message: 'Invalid or already-used unsubscribe link' });

    user.newsletterOptIn = false;
    await user.save();
    res.json({ message: 'You have been unsubscribed from the weekly deals newsletter.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const idToUpdate = req.params.id === 'me' ? req.user.id : req.params.id;

    if (idToUpdate !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (newPassword !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });

    const user = await User.findById(idToUpdate).select('+password');
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect old password' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserGames = async (req, res) => {
  try {
    const { status, sort } = req.query;
    let filter = { userId: req.user.id };
    if (status === 'inProgress') filter.inProgress = true;
    else if (status) filter.status = status;

    let query = UserGame.find(filter);
    if (sort === '-lastPlayedAt') query = query.sort({ lastPlayedAt: -1 });
    else query = query.sort({ addedAt: -1 });

    const games = await query;
    res.json({ count: games.length, games });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addOrUpdateUserGame = async (req, res) => {
  try {
    const { rawgId, rawgSlug, title, coverUrl, status, rating } = req.body;
    let userGame = await UserGame.findOne({ userId: req.user.id, rawgId });
    const isNew = !userGame;

    if (isNew) {
      userGame = new UserGame({ userId: req.user.id, rawgId, rawgSlug, title, coverUrl, status: status || 'library', rating });
      await userGame.save();
      await awardXP(req.user.id, 50, 'Pioneer');
    } else {
      const nextStatus = status || userGame.status;
      const unchangedStatus = nextStatus === userGame.status;
      const unchangedRating = rating === undefined;

      if (unchangedStatus && unchangedRating) {
        return res.status(200).json({
          message: `${title || userGame.title} is already in your ${nextStatus}`,
          alreadyExists: true,
          game: userGame,
        });
      }

      userGame.status = status || userGame.status;
      if (rating !== undefined) userGame.rating = rating;
      await userGame.save();
    }

    const user = await User.findById(req.user.id);
    if (user) {
      const allGames = await UserGame.find({ userId: req.user.id });
      const { changed, newBadges } = applyAutoBadges(user, allGames);
      ensureAdminPrestige(user);
      if (changed) {
        await user.save();
        notifyNewBadges(req.user.id, newBadges);
      }
    }

    res.json({ message: isNew ? 'Added to library' : 'Updated library entry', game: userGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeUserGame = async (req, res) => {
  try {
    await UserGame.findOneAndDelete({ userId: req.user.id, rawgId: req.params.rawgId });
    res.json({ message: 'Removed from library' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logPlaySession = async (req, res) => {
  try {
    const { minutesPlayed } = req.body;
    let userGame = await UserGame.findOne({ userId: req.user.id, rawgId: req.params.rawgId });
    if (!userGame) return res.status(404).json({ message: 'Game not found in library' });

    userGame.playtimeMinutes += (minutesPlayed || 30);
    userGame.sessionsCount += 1;
    userGame.lastPlayedAt = new Date();
    userGame.inProgress = true;
    await userGame.save();

    await awardXP(req.user.id, 10);
    res.json({ message: 'Play session logged', game: userGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const allGames = await UserGame.find({ userId: req.user.id });
    const autoResult = applyAutoBadges(user, allGames);
    ensureAdminPrestige(user);
    if (autoResult.changed) {
      await user.save();
      notifyNewBadges(req.user.id, autoResult.newBadges);
    }

    const totalPlaytimeHrs = Math.floor(autoResult.playtimeMinutes / 60);
    const wins = await Event.countDocuments({ 'winner.userId': user._id });

    const stats = {
      librarySize: autoResult.trackedCount,
      watchlistCount: autoResult.watchlistCount,
      completedCount: autoResult.completedCount,
      sessionsCount: autoResult.sessionsCount,
      playtimeThisWeek: Math.min(totalPlaytimeHrs, 40),
      leaderboardRank: Math.max(1, 500 - Math.floor((user.xp || 0) / 20)),
      level: user.level || 1,
      xp: user.xp || 0,
      badgesCount: Array.isArray(user.badges) ? user.badges.length : 0,
      eventsWon: wins,
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLeaderboardPreview = async (req, res) => {
  try {
    const topUsers = await User.find({ role: 'user' }).sort({ xp: -1 }).limit(5).select('username name xp level badges');
    const leaderboard = topUsers.map(u => ({
      userId: u._id,
      username: u.username || u.name,
      xp: u.xp,
      level: u.level,
      badgesCount: Array.isArray(u.badges) ? u.badges.length : 0,
      playtimeMinutes: Math.floor((u.xp || 0) * 4)
    }));
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFullLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({ role: 'user' }).sort({ xp: -1 }).limit(50).select('username name xp level badges avatar');
    res.json({ leaderboard: topUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
