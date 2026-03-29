const { GoogleGenAI } = require('@google/genai');
const User = require('../models/User');
const crypto = require('crypto');

const sanitizeApiKey = (rawValue) => String(rawValue || '')
  .trim()
  .replace(/^"+|"+$/g, '');

const getGeminiClient = () => {
  const key = sanitizeApiKey(
    process.env.GEMINI_API_KEY
      || process.env.GOOGLE_GENAI_API_KEY
      || process.env.GOOGLE_API_KEY
  );

  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'models/gemini-2.5-flash',
  'gemini-2.5-pro',
];

const hasBracketedGames = (text) => /\[\[[^\]]+\]\]/.test(String(text || ''));

const sanitizeDiscoveryAnswer = (text, query) => {
  const cleaned = String(text || '').trim();
  if (!cleaned) return buildFallbackAnswer(query);
  if (!hasBracketedGames(cleaned)) return buildFallbackAnswer(query);
  return cleaned;
};

const generateContentStreamWithFallback = async (ai, contents, config) => {
  let lastErr = null;
  for (const model of GEMINI_MODELS) {
    try {
      const stream = await ai.models.generateContentStream({ model, contents, config });
      return { stream, model };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
};

const generateContentWithFallback = async (ai, contents, config) => {
  let lastErr = null;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents, config });
      return { response, model };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
};

const isInvalidApiKeyError = (err) => {
  const message = String(err?.message || '').toLowerCase();
  return message.includes('api key not valid')
    || message.includes('api_key_invalid')
    || message.includes('invalid api key')
    || message.includes('permission_denied');
};

let consecutiveErrors = 0;
let freezeEndTime = 0;

const buildFallbackAnswer = (query) => {
  const q = (query || '').toLowerCase();

  if (q.includes('rpg')) {
    return 'Try [[Baldur\'s Gate 3]], [[Elden Ring]], and [[The Witcher 3]].';
  }
  if (q.includes('fps') || q.includes('shooter')) {
    return 'Good picks: [[Counter-Strike 2]], [[Apex Legends]], and [[DOOM Eternal]].';
  }
  if (q.includes('story') || q.includes('narrative')) {
    return 'Story-first recommendations: [[Red Dead Redemption 2]], [[Detroit: Become Human]], and [[Disco Elysium]].';
  }

  return 'Start with [[Hades]], [[Stardew Valley]], and [[Forza Horizon 5]].';
};

exports.streamDiscovery = async (req, res, next) => {
  const { query } = req.body;
  const userId = req.user?.id;

  if (Date.now() < freezeEndTime) {
    return res.status(503).json({
      error: 'AI Service temporarily unavailable. Please try again later.',
      ref: crypto.randomUUID(),
    });
  }

  if (!query || typeof query !== 'string' || query.length > 500) {
    return res.status(400).json({
      error: 'Invalid query. Maximum length is 500 characters.',
      ref: crypto.randomUUID(),
    });
  }

  try {
    let userContext = '';
    if (userId) {
      const user = await User.findById(userId).lean();
      if (user) {
        userContext = `\nHidden Context - User enjoys genres: ${user.favoriteGenres?.join(', ') || 'None'}. Wishlisted games: ${user.wishlist?.join(', ') || 'None'}. Tailor recommendations accordingly.`;
      }
    }

    const systemInstruction = [
      'You are GameVerse Discovery Oracle.',
      'Your ONLY job is to recommend games matching the user request.',
      'Do not explain your process. Do not write long introductions or meta commentary.',
      'Output exactly 4 to 6 recommendations.',
      'Every game title MUST be wrapped in double brackets, like [[Elden Ring]].',
      'After each title, add one short reason (max 12 words).',
      'Stay tightly on-topic and keep the answer compact and fun.',
    ].join(' ');
    const fullPrompt = `${systemInstruction}\n${userContext}\nUser Query: ${query}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const ai = getGeminiClient();
    if (!ai) {
      const fallback = buildFallbackAnswer(query);
      res.write(`data: ${JSON.stringify({ text: fallback, source: 'fallback-no-key' })}\n\n`);
      consecutiveErrors = 0;
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    try {
      const { stream: responseStream, model } = await generateContentStreamWithFallback(ai, fullPrompt, {
        temperature: 0.7,
        maxOutputTokens: 800,
      });

      let emitted = 0;
      let fullText = '';
      for await (const chunk of responseStream) {
        if (chunk?.text) {
          const textChunk = String(chunk.text || '');
          emitted += textChunk.length;
          fullText += textChunk;
        }
      }

      if (emitted === 0) {
        const fallback = buildFallbackAnswer(query);
        res.write(`data: ${JSON.stringify({ text: fallback, source: 'fallback-empty-stream' })}\n\n`);
      } else {
        const safeAnswer = sanitizeDiscoveryAnswer(fullText, query);
        res.write(`data: ${JSON.stringify({ text: safeAnswer, source: 'gemini', model })}\n\n`);
      }

      consecutiveErrors = 0;
      res.write('data: [DONE]\n\n');
      return res.end();
    } catch (streamErr) {
      consecutiveErrors += 1;
      if (consecutiveErrors >= 3) {
        freezeEndTime = Date.now() + 60 * 1000;
      }
      const fallback = buildFallbackAnswer(query);
      const source = isInvalidApiKeyError(streamErr)
        ? 'fallback-invalid-key'
        : 'fallback-stream-error';
      res.write(`data: ${JSON.stringify({ text: fallback, source })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }
  } catch (error) {
    if (!res.headersSent) {
      return next(error);
    }
    res.write(`data: ${JSON.stringify({ error: 'Stream error occurred.' })}\n\n`);
    return res.end();
  }
};

exports.chatSimple = async (req, res) => {
  try {
    const query = req.body?.prompt || req.body?.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'prompt is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ answer: buildFallbackAnswer(query), source: 'fallback-no-key' });
    }

    const { response, model } = await generateContentWithFallback(ai, query, {
      temperature: 0.6,
      maxOutputTokens: 500,
    });

    const answer = sanitizeDiscoveryAnswer(response?.text, query);
    return res.json({ answer, source: response?.text ? 'gemini' : 'fallback-empty', model: response?.text ? model : null });
  } catch (error) {
    console.error('[AI] chatSimple error:', error?.message || error);
    return res.json({ answer: buildFallbackAnswer(req.body?.prompt || req.body?.query || ''), source: 'fallback-error' });
  }
};
