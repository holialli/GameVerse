const mongoose = require('mongoose');

const lobbyMessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LobbyMessage', lobbyMessageSchema);
