const request = require('supertest');

// Render's health checker polls /api/health every few seconds from one
// address. If the /api rate limiter counts those polls, the checker gets 429s
// and Render marks the instance unhealthy.
describe('API rate limiter', () => {
  let app;

  beforeAll(() => {
    process.env.RATE_LIMIT_MAX_REQUESTS = '2';
    jest.isolateModules(() => {
      app = require('../app');
    });
  });

  afterAll(() => {
    delete process.env.RATE_LIMIT_MAX_REQUESTS;
  });

  it('never limits /api/health', async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    }
  });

  it('still limits other /api routes', async () => {
    const statuses = [];
    for (let i = 0; i < 3; i += 1) {
      statuses.push((await request(app).get('/api/does-not-exist')).status);
    }
    expect(statuses).toEqual([404, 404, 429]);
  });
});
