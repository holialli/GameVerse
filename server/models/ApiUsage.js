const mongoose = require('mongoose');

const apiUsageSchema = new mongoose.Schema({
  apiClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiClient', required: true },
  yearMonth: { type: String, required: true }, // e.g. "2026-07"
  count: { type: Number, default: 0 },
});

// One usage-counter doc per client per month - atomic $inc upserts against
// this compound key are how quota metering stays race-safe under concurrency.
apiUsageSchema.index({ apiClientId: 1, yearMonth: 1 }, { unique: true });

module.exports = mongoose.model('ApiUsage', apiUsageSchema);
