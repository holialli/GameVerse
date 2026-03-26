#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const UserGame = require('../models/UserGame');
const Event = require('../models/Event');

const GAME_POOL = [
  { rawgId: 1000001, rawgSlug: 'fortnite', title: 'Fortnite', coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg', status: 'library' },
  { rawgId: 1000002, rawgSlug: 'valorant', title: 'VALORANT', coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2k7f.jpg', status: 'library' },
  { rawgId: 1000003, rawgSlug: 'elden-ring', title: 'Elden Ring', coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg', status: 'completed' },
  { rawgId: 1000004, rawgSlug: 'minecraft', title: 'Minecraft', coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg', status: 'watchlist' },
  { rawgId: 1000005, rawgSlug: 'gta-v', title: 'Grand Theft Auto V', coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1ntf.jpg', status: 'library' },
  { rawgId: 1000006, rawgSlug: 'apex-legends', title: 'Apex Legends', coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2u0s.jpg', status: 'watchlist' },
  { rawgId: 1000007, rawgSlug: 'cyberpunk-2077', title: 'Cyberpunk 2077', coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co7497.jpg', status: 'completed' },
];

const calcLevel = (xp) => Math.max(1, Math.floor(Math.sqrt((xp || 0) / 100)) + 1);

const ensureBadge = (user, badge) => {
  const exists = (user.badges || []).some((b) => b.key === badge.key || b.name === badge.name);
  if (!exists) {
    user.badges.push({
      key: badge.key,
      name: badge.name,
      tier: badge.tier,
      description: badge.description,
      awardedAt: new Date(),
    });
  }
};

const seedUsers = async () => {
  const users = await User.find({ role: 'user' }).limit(12);

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    const xp = 600 + i * 420;
    user.xp = Math.max(user.xp || 0, xp);
    user.level = calcLevel(user.xp);
    if (!Array.isArray(user.badges)) user.badges = [];

    ensureBadge(user, {
      key: 'first-track',
      name: 'First Contact',
      tier: 'minor',
      description: 'Tracked your first game.',
    });

    if (user.xp >= 1400) {
      ensureBadge(user, {
        key: 'curator-ii',
        name: 'Curator II',
        tier: 'major',
        description: 'Built a deep library.',
      });
    }

    if (user.xp >= 2600) {
      ensureBadge(user, {
        key: 'rising-myth',
        name: 'Rising Myth',
        tier: 'major',
        description: 'Reached high XP milestones.',
      });
    }

    await user.save();

    const sample = GAME_POOL.slice(0, Math.min(GAME_POOL.length, 3 + (i % 4)));
    for (let j = 0; j < sample.length; j += 1) {
      const game = sample[j];
      await UserGame.findOneAndUpdate(
        { userId: user._id, rawgId: game.rawgId },
        {
          $set: {
            userId: user._id,
            rawgId: game.rawgId,
            rawgSlug: game.rawgSlug,
            title: game.title,
            coverUrl: game.coverUrl,
            status: j === 0 ? 'library' : game.status,
            playtimeMinutes: 120 + (i * 35) + (j * 50),
            sessionsCount: 6 + i + j,
            inProgress: j !== 2,
            rating: Math.min(10, 6 + j + (i % 3)),
            lastPlayedAt: new Date(Date.now() - (j + 1) * 86400000),
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }
  }

  return users;
};

const seedEvents = async (users) => {
  if (!users.length) return;
  const now = Date.now();

  const templates = [
    {
      title: 'GameVerse Spring Invitational',
      description: 'Cross-title invitational with ranked finals.',
      category: 'Tournament',
      isFeatured: true,
      prizePool: '$15,000',
      pointsAwarded: 300,
      scheduledStartTime: new Date(now - 10 * 24 * 60 * 60 * 1000),
      scheduledEndTime: new Date(now - 9 * 24 * 60 * 60 * 1000),
      status: 'completed',
      winner: users[0]?._id,
    },
    {
      title: 'Neon Clash Showmatch',
      description: 'Best-of-seven creator showdown.',
      category: 'Showmatch',
      isFeatured: false,
      prizePool: '$2,500',
      pointsAwarded: 120,
      scheduledStartTime: new Date(now - 3 * 24 * 60 * 60 * 1000),
      scheduledEndTime: new Date(now - 2 * 24 * 60 * 60 * 1000),
      status: 'completed',
      winner: users[1]?._id,
    },
    {
      title: 'Summer Qualifier Open',
      description: 'Open bracket qualifier for the seasonal finals.',
      category: 'Qualifier',
      isFeatured: true,
      prizePool: '$8,000',
      pointsAwarded: 180,
      scheduledStartTime: new Date(now + 3 * 24 * 60 * 60 * 1000),
      scheduledEndTime: new Date(now + 4 * 24 * 60 * 60 * 1000),
      status: 'scheduled',
    },
    {
      title: 'Autumn Community Cup',
      description: 'Community event with mixed-skill teams and highlight awards.',
      category: 'Community',
      isFeatured: false,
      prizePool: '$4,000',
      pointsAwarded: 100,
      scheduledStartTime: new Date(now + 12 * 24 * 60 * 60 * 1000),
      scheduledEndTime: new Date(now + 13 * 24 * 60 * 60 * 1000),
      status: 'scheduled',
    },
  ];

  const participantIds = users.slice(0, 8).map((u) => u._id);

  for (const template of templates) {
    const winnerUser = template.winner ? users.find((u) => String(u._id) === String(template.winner)) : null;
    await Event.findOneAndUpdate(
      { title: template.title },
      {
        $set: {
          title: template.title,
          description: template.description,
          category: template.category,
          scheduledStartTime: template.scheduledStartTime,
          scheduledEndTime: template.scheduledEndTime,
          prizePool: template.prizePool,
          pointsAwarded: template.pointsAwarded,
          status: template.status,
          isFeatured: template.isFeatured,
          participants: participantIds,
          winner: winnerUser
            ? {
                userId: winnerUser._id,
                username: winnerUser.username || winnerUser.name,
              }
            : { userId: null, username: '' },
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }
};

const seedCommunityState = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gameverse');
    const users = await seedUsers();
    await seedEvents(users);

    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      if (!Array.isArray(admin.badges)) admin.badges = [];
      ensureBadge(admin, {
        key: 'admin-aegis',
        name: 'Aegis Prime',
        tier: 'super',
        description: 'Granted to platform administrators.',
      });
      admin.xp = Math.max(admin.xp || 0, 15000);
      admin.level = Math.max(admin.level || 1, calcLevel(admin.xp));
      await admin.save();
    }

    console.log(`Seeded community state for ${users.length} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed community state:', error);
    process.exit(1);
  }
};

seedCommunityState();
