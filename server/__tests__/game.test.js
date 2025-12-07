const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Game = require('../models/Game');

let authToken;
let userId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gameverse_test');
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Game.deleteMany({});

  // Create a user and get token
  const registerRes = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  });

  authToken = registerRes.body.accessToken;
  userId = registerRes.body.user.id;
});

describe('Game Controller', () => {
  describe('POST /api/games', () => {
    it('should create a game when authenticated', async () => {
      const res = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Elden Ring',
          description: 'A challenging action RPG',
          genre: 'RPG',
          releaseDate: '2022-02-25',
          rating: 9,
          platform: ['PC', 'PlayStation'],
          developer: 'FromSoftware',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.game.title).toBe('Elden Ring');
      expect(res.body.game.createdBy).toBe(userId);
    });

    it('should not create a game without authentication', async () => {
      const res = await request(app).post('/api/games').send({
        title: 'Elden Ring',
        description: 'A challenging action RPG',
        genre: 'RPG',
        releaseDate: '2022-02-25',
        rating: 9,
        platform: ['PC', 'PlayStation'],
        developer: 'FromSoftware',
      });

      expect(res.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Elden Ring',
          // Missing description
          genre: 'RPG',
          releaseDate: '2022-02-25',
          platform: ['PC'],
          developer: 'FromSoftware',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/games', () => {
    beforeEach(async () => {
      await Game.create([
        {
          title: 'Elden Ring',
          description: 'Action RPG',
          genre: 'RPG',
          releaseDate: new Date('2022-02-25'),
          rating: 9,
          platform: ['PC', 'PlayStation'],
          developer: 'FromSoftware',
          createdBy: userId,
        },
        {
          title: 'Cyberpunk 2077',
          description: 'Sci-fi action RPG',
          genre: 'RPG',
          releaseDate: new Date('2020-12-10'),
          rating: 7,
          platform: ['PC', 'PlayStation'],
          developer: 'CD Projekt Red',
          createdBy: userId,
        },
      ]);
    });

    it('should get all games', async () => {
      const res = await request(app).get('/api/games');

      expect(res.statusCode).toBe(200);
      expect(res.body.games.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter games by genre', async () => {
      const res = await request(app).get('/api/games?genre=RPG');

      expect(res.statusCode).toBe(200);
      expect(res.body.games.every((g) => g.genre === 'RPG')).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app).get('/api/games?page=1&limit=1');

      expect(res.statusCode).toBe(200);
      expect(res.body.games.length).toBe(1);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(1);
    });

    it('should sort by rating', async () => {
      const res = await request(app).get('/api/games?sort=rating');

      expect(res.statusCode).toBe(200);
      expect(res.body.games[0].rating).toBeGreaterThanOrEqual(res.body.games[1].rating);
    });
  });

  describe('GET /api/games/:id', () => {
    let gameId;

    beforeEach(async () => {
      const game = await Game.create({
        title: 'Elden Ring',
        description: 'Action RPG',
        genre: 'RPG',
        releaseDate: new Date('2022-02-25'),
        rating: 9,
        platform: ['PC', 'PlayStation'],
        developer: 'FromSoftware',
        createdBy: userId,
      });

      gameId = game._id;
    });

    it('should get a single game by ID', async () => {
      const res = await request(app).get(`/api/games/${gameId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Elden Ring');
    });

    it('should return 404 for non-existent game', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/games/${fakeId}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/games/:id', () => {
    let gameId;

    beforeEach(async () => {
      const game = await Game.create({
        title: 'Elden Ring',
        description: 'Action RPG',
        genre: 'RPG',
        releaseDate: new Date('2022-02-25'),
        rating: 9,
        platform: ['PC', 'PlayStation'],
        developer: 'FromSoftware',
        createdBy: userId,
      });

      gameId = game._id;
    });

    it('should update game when authenticated and owner', async () => {
      const res = await request(app)
        .patch(`/api/games/${gameId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 10,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.game.rating).toBe(10);
    });

    it('should not update if not authenticated', async () => {
      const res = await request(app).patch(`/api/games/${gameId}`).send({
        rating: 10,
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/games/:id', () => {
    let gameId;

    beforeEach(async () => {
      const game = await Game.create({
        title: 'Elden Ring',
        description: 'Action RPG',
        genre: 'RPG',
        releaseDate: new Date('2022-02-25'),
        rating: 9,
        platform: ['PC', 'PlayStation'],
        developer: 'FromSoftware',
        createdBy: userId,
      });

      gameId = game._id;
    });

    it('should delete game when authenticated and owner', async () => {
      const res = await request(app)
        .delete(`/api/games/${gameId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);

      const deletedGame = await Game.findById(gameId);
      expect(deletedGame).toBeNull();
    });

    it('should not delete if not authenticated', async () => {
      const res = await request(app).delete(`/api/games/${gameId}`);

      expect(res.statusCode).toBe(401);
    });
  });
});
