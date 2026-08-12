const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../models/Event', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/User', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
}));

const Event = require('../models/Event');
const User = require('../models/User');

const JWT_SECRET = 'test-secret';
const tokenFor = (id, role) => jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '15m' });

const validEventBody = {
  title: 'Community Cup',
  description: 'A friendly community tournament.',
  category: 'Tournament',
  scheduledStartTime: '2027-01-01T00:00:00.000Z',
  scheduledEndTime: '2027-01-02T00:00:00.000Z',
  prizePool: '$100',
  pointsAwarded: 10,
};

describe('event authorization: direct create/join bypass admin-approval workflow', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = JWT_SECRET;
    const eventRoutes = require('../routes/eventRoutes');
    app = express();
    app.use(express.json());
    app.use('/api/events', eventRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects direct event creation from a non-admin user with 403', async () => {
    User.findById.mockReturnValue({ select: () => Promise.resolve({ role: 'user' }) });

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${tokenFor('user1', 'user')}`)
      .send(validEventBody);

    expect(res.status).toBe(403);
    expect(Event.create).not.toHaveBeenCalled();
  });

  it('rejects direct event join from a non-admin user with 403', async () => {
    User.findById.mockReturnValue({ select: () => Promise.resolve({ role: 'user' }) });

    const res = await request(app)
      .post('/api/events/event1/join')
      .set('Authorization', `Bearer ${tokenFor('user1', 'user')}`);

    expect(res.status).toBe(403);
    expect(Event.findById).not.toHaveBeenCalled();
  });

  it('rejects both routes with 401 when no token is provided at all', async () => {
    const createRes = await request(app).post('/api/events').send(validEventBody);
    expect(createRes.status).toBe(401);

    const joinRes = await request(app).post('/api/events/event1/join');
    expect(joinRes.status).toBe(401);
  });

  it('allows an admin to create and directly join an event', async () => {
    User.findById.mockReturnValue({ select: () => Promise.resolve({ role: 'admin' }) });
    Event.create.mockResolvedValue({ _id: 'event1' });

    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${tokenFor('admin1', 'admin')}`)
      .send(validEventBody);

    expect(createRes.status).toBe(201);
    expect(Event.create).toHaveBeenCalled();

    Event.findById.mockResolvedValue({
      status: 'scheduled',
      participants: [],
      save: jest.fn().mockResolvedValue(true),
    });

    const joinRes = await request(app)
      .post('/api/events/event1/join')
      .set('Authorization', `Bearer ${tokenFor('admin1', 'admin')}`);

    expect(joinRes.status).toBe(200);
  });
});
