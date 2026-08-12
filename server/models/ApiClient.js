const mongoose = require('mongoose');

const apiClientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contactEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    keyHash: { type: String, required: true, unique: true }, // sha256 of the raw key - never store plaintext
    keyPrefix: { type: String, required: true }, // first 8 chars, for dashboard/support identification
    plan: { type: String, enum: ['free', 'paid'], default: 'free' },
    monthlyLimit: { type: Number, default: 1000 },
    lemonSqueezyCustomerId: { type: String, default: null },
    lemonSqueezySubscriptionId: { type: String, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiClient', apiClientSchema);
