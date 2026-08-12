const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../models/HardwareLayer', () => ({
  findById: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../models/UserGame', () => ({
  findOne: jest.fn(),
}));

const HardwareLayer = require('../models/HardwareLayer');
const UserGame = require('../models/UserGame');

const JWT_SECRET = 'test-secret';

const hardwareById = {
  'cpu-high': { _id: 'cpu-high', componentType: 'cpu', name: 'High-end CPU', performanceScore: 90 },
  'gpu-high': { _id: 'gpu-high', componentType: 'gpu', name: 'High-end GPU', performanceScore: 95 },
  'cpu-low': { _id: 'cpu-low', componentType: 'cpu', name: 'Low-end CPU', performanceScore: 40 },
  'gpu-low': { _id: 'gpu-low', componentType: 'gpu', name: 'Low-end GPU', performanceScore: 35 },
};

describe('hardware compatibility scoring', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = JWT_SECRET;
    const hardwareRoutes = require('../routes/hardwareRoutes');
    app = express();
    app.use(express.json());
    app.use('/api/hardware', hardwareRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    HardwareLayer.findById.mockImplementation((id) => ({
      lean: () => Promise.resolve(hardwareById[id] || null),
    }));
    UserGame.findOne.mockReturnValue({
      lean: () => Promise.resolve({ rawgId: 123, title: 'Test Game', coverUrl: null }),
    });
  });

  const authHeader = `Bearer ${jwt.sign({ id: 'user1', role: 'user' }, JWT_SECRET, { expiresIn: '15m' })}`;

  it('returns a "Green" tier for a strong CPU/GPU with sufficient RAM', async () => {
    const res = await request(app)
      .get('/api/hardware/compatibility/123')
      .set('Authorization', authHeader)
      .query({ cpuId: 'cpu-high', gpuId: 'gpu-high', ramGb: 16, platform: 'pc' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Green');
    expect(res.body.tier).toBe('Great Fit');
  });

  it('returns a "Red" tier for a weak CPU/GPU with little RAM', async () => {
    const res = await request(app)
      .get('/api/hardware/compatibility/123')
      .set('Authorization', authHeader)
      .query({ cpuId: 'cpu-low', gpuId: 'gpu-low', ramGb: 4, platform: 'pc' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Red');
    expect(res.body.tier).toBe('Needs upgrades');
  });

  it('falls back to a public preview when no auth token is provided', async () => {
    const res = await request(app)
      .get('/api/hardware/compatibility/123')
      .query({ cpuId: 'cpu-high', gpuId: 'gpu-high', ramGb: 16 });

    expect(res.status).toBe(200);
    expect(res.body.requiresAuth).toBe(true);
  });
});
