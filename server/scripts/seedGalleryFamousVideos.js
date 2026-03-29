#!/usr/bin/env node

const mongoose = require('mongoose');

const User = require('../models/User');
const Video = require('../models/Video');

const CLIPS = [
  {
    title: 'Fortnite Chapter 5 Gameplay Trailer',
    url: 'https://www.youtube.com/watch?v=O6z-l7Y8CIw',
    videoId: 'O6z-l7Y8CIw',
    platform: 'youtube',
    thumbnailUrl: 'https://i.ytimg.com/vi/O6z-l7Y8CIw/hqdefault.jpg',
    channelName: 'Fortnite',
  },
  {
    title: 'EA SPORTS FC 24 Official Gameplay',
    url: 'https://www.youtube.com/watch?v=XhP3Xh4LMA8',
    videoId: 'XhP3Xh4LMA8',
    platform: 'youtube',
    thumbnailUrl: 'https://i.ytimg.com/vi/XhP3Xh4LMA8/hqdefault.jpg',
    channelName: 'EA SPORTS FC',
  },
  {
    title: 'Grand Theft Auto V Trailer',
    url: 'https://www.youtube.com/watch?v=QkkoHAzjnUs',
    videoId: 'QkkoHAzjnUs',
    platform: 'youtube',
    thumbnailUrl: 'https://i.ytimg.com/vi/QkkoHAzjnUs/hqdefault.jpg',
    channelName: 'Rockstar Games',
  },
];

const connectDb = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGO_URI or MONGODB_URI in environment');
  }

  await mongoose.connect(uri);
};

const run = async () => {
  await connectDb();

  const admin = await User.findOne({ role: 'admin' }).select('_id');
  const fallbackUser = admin || await User.findOne({ role: 'user' }).select('_id');

  if (!fallbackUser?._id) {
    throw new Error('No user found to attribute seeded videos. Create an admin or user first.');
  }

  let created = 0;
  let updated = 0;

  for (const clip of CLIPS) {
    const existing = await Video.findOne({ url: clip.url });
    if (existing) {
      existing.title = clip.title;
      existing.videoId = clip.videoId;
      existing.platform = clip.platform;
      existing.thumbnailUrl = clip.thumbnailUrl;
      existing.channelName = clip.channelName;
      existing.uploadedBy = existing.uploadedBy || fallbackUser._id;
      existing.status = 'pending';
      existing.approvedAt = null;
      existing.approvedBy = null;
      existing.activeUntil = null;
      await existing.save();
      updated += 1;
      continue;
    }

    await Video.create({
      title: clip.title,
      url: clip.url,
      platform: clip.platform,
      videoId: clip.videoId,
      thumbnailUrl: clip.thumbnailUrl,
      channelName: clip.channelName,
      uploadedBy: fallbackUser._id,
      status: 'pending',
    });
    created += 1;
  }

  console.log(`Seed complete. created=${created}, updated=${updated}. All seeded clips are pending admin approval.`);
};

run()
  .catch((err) => {
    console.error('Failed to seed gallery videos:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch (err) {
    }
  });
