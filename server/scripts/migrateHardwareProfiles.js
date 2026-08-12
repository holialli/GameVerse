#!/usr/bin/env node

// One-off: converts each user's legacy single `hardwareProfile` object into
// a named entry in the new `hardwareProfiles` array. Safe to run multiple
// times - skips users who already have hardwareProfiles entries or no
// usable legacy data.

const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gameverse');

  const users = await User.find({
    $or: [{ hardwareProfiles: { $exists: false } }, { hardwareProfiles: { $size: 0 } }],
  });

  let migrated = 0;
  for (const user of users) {
    const legacy = user.hardwareProfile || {};
    if (!legacy.cpuId && !legacy.gpuId) continue;

    user.hardwareProfiles.push({
      name: 'My PC',
      cpuId: legacy.cpuId || undefined,
      gpuId: legacy.gpuId || undefined,
      ramGb: legacy.ramGb || 16,
      platform: legacy.platform || 'pc',
      isDefault: true,
    });
    await user.save();
    migrated += 1;
  }

  console.log(`Migrated ${migrated} legacy hardware profile(s).`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
