const { GoogleGenAI } = require('@google/genai');
const User = require('../models/User'); // Mongoose model
const crypto = require('crypto');

const aiApiKey = process.env.GEMINI_API_KEY;
const ai = aiApiKey ? new GoogleGenAI({ apiKey: aiApiKey }) : null;

// Circuit Breaker State (simple in-memory instance, could be moved to Redis for dist)
let consecutiveErrors = 0;
let freezeEndTime = 0;

const buildFallbackAnswer = (query) => {
  const q = (query || '').toLowerCase();

  if (q.includes('rpg')) {
    return 'Try [[Baldur\'s Gate 3]], [[Elden Ring]], and [[The Witcher 3]]. Start with balanced builds and focus on stamina/resource management in early fights.';
  }

  if (q.includes('fps') || q.includes('shooter')) {
    return 'Good picks: [[Counter-Strike 2]], [[Apex Legends]], and [[DOOM Eternal]]. Improve aim with 10-minute tracking drills before ranked sessions.';
  }

  if (q.includes('story') || q.includes('narrative')) {
    return 'Story-first recommendations: [[Red Dead Redemption 2]], [[Detroit: Become Human]], and [[Disco Elysium]].';
  }

  return 'Start with [[Hades]], [[Stardew Valley]], and [[Forza Horizon 5]] for variety. If you share your favorite genre, I can narrow this down.';
};

exports.streamDiscovery = async (req, res, next) => {
  const { query } = req.body;
  const userId = req.user?.id;

  // Circuit Breaker Check
  if (Date.now() < freezeEndTime) {
    return res.status(503).json({ 
      error: "AI Service temporarily unavailable. Please try again later.", 
      ref: crypto.randomUUID() 
    });
  }

  // Input Sanitization (Max 500 chars)
  if (!query || typeof query !== 'string' || query.length > 500) {
    return res.status(400).json({ 
      error: "Invalid query. Maximum length is 500 characters.", 
      ref: crypto.randomUUID() 
    });
  }

  try {
    // Hidden Context Injection
    let userContext = '';
    if (userId) {
      const user = await User.findById(userId).lean();
      if (user) {
        userContext = `\nHidden Context - User enjoys genres: ${user.favoriteGenres?.join(', ') || 'None'}. Wishlisted games: ${user.wishlist?.join(', ') || 'None'}. Tailor recommendations accordingly. `;
      }
    }

    // Attempt to fetch prompt from Admin SiteConfig, fallback to default
    // Normally this would query DB, e.g. SiteConfig.findOne({ key: 'gemini_system_prompt' })
    const systemInstruction = "You are a Game Discovery Oracle. Provide excellent game recommendations based on the query. IMPORTANT: When you recommend a specific game title, strictly wrap the exact game title in double brackets, e.g., [[The Witcher 3]].";

    const fullPrompt = `${systemInstruction}\n${userContext}\nUser Query: ${query}`;

    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (!ai) {
      const fallback = buildFallbackAnswer(query);
      res.write(`data: ${JSON.stringify({ text: fallback })}\n\n`);
    } else {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-1.5-pro',
        contents: fullPrompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          // Send memory-efficient Server-Sent Events (SSE)
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
    }

    // Success - reset breaker
    consecutiveErrors = 0;
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Gemini error:', error);
    
    consecutiveErrors++;
    if (consecutiveErrors >= 3) {
      freezeEndTime = Date.now() + 60 * 1000; // 60s cooldown
    }

    // Only send error if headers haven't been sent yet
    if (!res.headersSent) {
      next(error); 
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error occurred." })}\n\n`);
      res.end();
    }
  }
};

exports.chatSimple = async (req, res) => {
  try {
    const query = req.body?.prompt || req.body?.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'prompt is required' });
    }

    if (!ai) {
      return res.json({ answer: buildFallbackAnswer(query) });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: query,
      config: {
        temperature: 0.6,
        maxOutputTokens: 500,
      },
    });

    return res.json({ answer: response.text || buildFallbackAnswer(query) });
  } catch (error) {
    return res.json({ answer: buildFallbackAnswer(req.body?.prompt || req.body?.query || '') });
  }
};
