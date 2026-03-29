const { Server } = require('socket.io');
let createAdapter = null;
try {
  ({ createAdapter } = require('@socket.io/redis-adapter'));
} catch (err) {
  createAdapter = null;
}
const redisClient = require('./utils/redisClient');
const jwt = require('jsonwebtoken');
const { moderateMessageAsync, syncFilter } = require('./services/moderationService');
const LobbyMessage = require('./models/LobbyMessage');

const resolveJwtSecret = () => {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET || null;
};

let pubClient = null;
let subClient = null;

if (redisClient) {
  pubClient = redisClient.duplicate();
  subClient = redisClient.duplicate();
  pubClient.on('error', (err) => console.error('Redis pub client error:', err));
  subClient.on('error', (err) => console.error('Redis sub client error:', err));
}

let io;

exports.initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'https://game-verse.tech',
        'http://localhost:3000',
        process.env.CLIENT_URL,
      ].filter(Boolean),
      credentials: true,
    }
  });

  if (pubClient && subClient && createAdapter) {
    io.adapter(createAdapter(pubClient, subClient));
  }

  // Middleware for JWT validation
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const jwtSecret = resolveJwtSecret();
    if (!token) return next(new Error('Authentication error: No token provided'));
    if (!jwtSecret) return next(new Error('Authentication error: Server misconfiguration'));

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      socket.user = decoded; // Contains {id, role}
      next();
    });
  });

  io.on('connection', async (socket) => {
    // Phase 6: Global lobby isolation
    socket.join('globalLobby');

    try {
        // Load messages directly from the capped MongoDB collection
        const recentMessages = await LobbyMessage.find().sort({ timestamp: -1 }).limit(50);
        socket.emit('history', recentMessages.reverse()); // Send chronologically
    } catch(err) { console.error('History load error', err); }

    socket.on('sendMessage', async ({ content, username }) => {
      const cleanContent = String(content || '').trim().slice(0, 500);
      if (!cleanContent) {
        return socket.emit('messageBlocked', { reason: 'Message cannot be empty.' });
      }

      // 1. Sync regex block
      if (!syncFilter(cleanContent)) {
          return socket.emit('messageBlocked', { reason: 'Message contains blocked terms.' });
      }

      // Live verification of shadowBan state via Redis cache (to avoid DB hit per message)
      let isShadowBanned = false;
      if (redisClient) {
        try {
          isShadowBanned = (await redisClient.get(`shadowban:${socket.user.id}`)) === 'true';
        } catch (err) {
          console.error('Redis shadowban lookup failed:', err);
        }
      }

      const safeUsername = String(username || '').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().slice(0, 32) || 'User';

      const msgObj = {
          content: cleanContent,
          userId: socket.user.id,
          username: safeUsername,
          role: socket.user.role,
          timestamp: new Date()
      };

      if (isShadowBanned) {
         // Echo only to the shadowbanned sender
         socket.emit('newMessage', msgObj);
      } else {
         // Phase 6 requirements: Write directly to MongoDB (Capped Collection)
         const savedMessage = await LobbyMessage.create(msgObj);
         
         // Broadcast to all legitimate users in global lobby
         io.to('globalLobby').emit('newMessage', savedMessage);
         
         // 2. Async AI Moderation checking - strictly non-blocking
         moderateMessageAsync(socket.user.id, safeUsername, cleanContent);
      }
    });

    socket.on('disconnect', () => {
       // Cleanup handled implicitly by socket.io and redis adapter
    });
  });

  return io;
};

exports.getIo = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
