const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../services/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

// Fake in-memory Redis: the refreshToken flow depends on real get/set/del/
// sadd/srem/smembers semantics (reverse lookup + per-user session set), so
// a plain jest.fn() stub isn't enough - it needs actual storage behavior.
jest.mock('../utils/redisClient', () => {
  const store = new Map();
  const sets = new Map();
  return {
    get: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    set: jest.fn(async (key, value) => {
      store.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (...keys) => {
      let count = 0;
      keys.flat().forEach((k) => {
        if (store.delete(k)) count += 1;
      });
      return count;
    }),
    sadd: jest.fn(async (key, member) => {
      if (!sets.has(key)) sets.set(key, new Set());
      sets.get(key).add(member);
      return 1;
    }),
    srem: jest.fn(async (key, member) => {
      if (sets.has(key)) sets.get(key).delete(member);
      return 1;
    }),
    smembers: jest.fn(async (key) => (sets.has(key) ? Array.from(sets.get(key)) : [])),
  };
});

const User = require('../models/User');

describe('auth: register -> login -> refresh', () => {
  let app;
  let usersById;
  let nextId;

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    jest.clearAllMocks();

    usersById = new Map();
    nextId = 1;

    User.findOne.mockImplementation((filter) => {
      const match = [...usersById.values()].find((u) =>
        Object.entries(filter).every(([key, value]) => u[key] === value)) || null;
      return {
        select: () => Promise.resolve(match),
        then: (resolve, reject) => Promise.resolve(match).then(resolve, reject),
      };
    });

    User.findById.mockImplementation((id) => Promise.resolve(usersById.get(String(id)) || null));

    User.create.mockImplementation(async (data) => {
      const id = String(nextId);
      nextId += 1;
      const hashed = await bcrypt.hash(data.password, 4);
      const doc = {
        _id: id,
        role: 'user',
        ...data,
        password: hashed,
        matchPassword: async (pwd) => bcrypt.compare(pwd, hashed),
      };
      usersById.set(id, doc);
      return doc;
    });

    const authRoutes = require('../routes/authRoutes');
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
  });

  const registerPayload = {
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password1!',
    confirmPassword: 'Password1!',
  };

  it('registers a new user and issues an access + refresh token', async () => {
    const res = await request(app).post('/api/auth/register').send(registerPayload);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('logs in with the registered credentials', async () => {
    await request(app).post('/api/auth/register').send(registerPayload);

    const res = await request(app).post('/api/auth/login').send({
      email: registerPayload.email,
      password: registerPayload.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('rotates the refresh token on use and rejects replay of the consumed token', async () => {
    const agent = request.agent(app);
    const registerRes = await agent.post('/api/auth/register').send(registerPayload);
    const originalRefreshToken = registerRes.body.refreshToken;

    // Cookie jar on the agent carries the refreshToken cookie automatically.
    const refreshRes = await agent.post('/api/auth/refresh');
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.refreshToken).toBeTruthy();
    expect(refreshRes.body.refreshToken).not.toBe(originalRefreshToken);

    // Replaying the now-rotated-out original token must be rejected, not
    // silently accepted (this is the bug: req.user was always undefined,
    // so refresh always 401'd - now the token itself resolves the user).
    const replayRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${originalRefreshToken}`]);
    expect(replayRes.status).toBe(403);

    // The rotated token continues to work for a further refresh.
    const secondRefreshRes = await agent.post('/api/auth/refresh');
    expect(secondRefreshRes.status).toBe(200);
    expect(secondRefreshRes.body.refreshToken).not.toBe(refreshRes.body.refreshToken);
  });

  it('rejects refresh when no refresh token cookie is present', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});
