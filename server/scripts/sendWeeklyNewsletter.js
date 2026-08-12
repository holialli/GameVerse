#!/usr/bin/env node

// Weekly curated deals digest. Meant to be triggered by an external
// scheduler (e.g. a cron entry on the deploy box) - there's no in-process
// job runner in this backend, and adding one just for a once-a-week email
// isn't worth a new always-on dependency.
//
// For each opted-in user, checks CheapShark (via priceComparisonService,
// same module Phase 2's price-comparison widget uses) for the single best
// current deal on each of their most-recently-tracked library/watchlist
// titles, and emails a digest of only the ones that are actually
// discounted. Users with no discounted titles this week get no email -
// an empty "your prices are the same" digest is not worth sending.

const mongoose = require('mongoose');
const User = require('../models/User');
const UserGame = require('../models/UserGame');
const { getPricesForTitle } = require('../services/priceComparisonService');
const { sendNewsletterEmail } = require('../services/emailService');

const TITLES_PER_USER = 5;

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gameverse');

  const subscribers = await User.find({ newsletterOptIn: true, newsletterUnsubscribeToken: { $ne: null } });
  console.log(`Found ${subscribers.length} newsletter subscriber(s).`);

  let sent = 0;
  for (const user of subscribers) {
    const tracked = await UserGame.find({ userId: user._id, status: { $in: ['library', 'watchlist'] } })
      .sort('-addedAt')
      .limit(TITLES_PER_USER);

    const entries = [];
    for (const game of tracked) {
      const deals = await getPricesForTitle(game.title);
      const bestDeal = deals[0];
      if (bestDeal && bestDeal.price < bestDeal.retailPrice) {
        entries.push({ title: game.title, bestDeal });
      }
    }

    if (entries.length === 0) continue;

    await sendNewsletterEmail(user.email, user.name, entries, user.newsletterUnsubscribeToken);
    sent += 1;
  }

  console.log(`Sent ${sent} newsletter digest(s).`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Newsletter send failed:', err);
  process.exit(1);
});
