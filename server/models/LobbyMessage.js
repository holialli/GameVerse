const mongoose = require('mongoose');

const lobbyMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  username: { type: String, required: true, trim: true, maxlength: 64 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  content: { type: String, required: true, trim: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now, index: { expires: '24h' } },
});

module.exports = mongoose.model('LobbyMessage', lobbyMessageSchema);
