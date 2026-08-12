const request = require('supertest');
const express = require('express');

describe('AI chat fallback', () => {
  let app;

  beforeAll(() => {
    // No Gemini credentials configured -> getGeminiClient() returns null ->
    // chatSimple must return the canned fallback answer instead of erroring.
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENAI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    const aiRoutes = require('../routes/aiRoutes');
    app = express();
    app.use(express.json());
    app.use('/api/ai', aiRoutes);
  });

  it('returns a canned fallback answer in the expected {answer, source, model} shape', async () => {
    const res = await request(app).post('/api/ai/chat').send({ prompt: 'Suggest an RPG' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('fallback-no-key');
    expect(typeof res.body.answer).toBe('string');
    // buildFallbackAnswer always wraps recommended titles in [[double brackets]].
    expect(res.body.answer).toMatch(/\[\[[^\]]+\]\]/);
  });

  it('rejects a request with no prompt/query', async () => {
    const res = await request(app).post('/api/ai/chat').send({});
    expect(res.status).toBe(400);
  });
});
