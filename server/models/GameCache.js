const mongoose = require('mongoose');

const gameCacheSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours TTL
  }
});

module.exports = mongoose.model('GameCache', gameCacheSchema);
