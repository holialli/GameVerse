const mongoose = require('mongoose');

const tierSchema = new mongoose.Schema(
  {
    cpuModel: { type: String, default: null },
    gpuModel: { type: String, default: null },
    ramGb: { type: Number, default: null },
    raw: { type: String, default: null },
  },
  { _id: false }
);

const gameRequirementsSchema = new mongoose.Schema({
  rawgId: { type: Number, required: true, unique: true, index: true },
  minimum: { type: tierSchema, default: null },
  recommended: { type: tierSchema, default: null },
  parsedAt: { type: Date, default: Date.now },
  parseSource: { type: String, enum: ['regex', 'manual'], default: 'regex' },
  parseVersion: { type: Number, default: 1 },
});

module.exports = mongoose.model('GameRequirements', gameRequirementsSchema);
