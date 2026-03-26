const { GoogleGenAI } = require('@google/genai');
const User = require('../models/User');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BANNED_WORDS = ['hate', 'slur1', 'slur2']; // Expandable list

// Tier 1: Synchronous zero-latency regex check
exports.syncFilter = (message) => {
  const regex = new RegExp(`\\b(${BANNED_WORDS.join('|')})\\b`, 'i');
  return !regex.test(message);
};

// Tier 2: Asynchronous context-aware AI toxicity check
exports.moderateMessageAsync = async (userId, username, content) => {
  try {
    const prompt = `Analyze the following gaming lobby chat message for severe toxicity, hate speech, or harassment. Answer strictly with pure JSON: {"isToxic": boolean}. Message: "${content}"`;
    
    const responseStream = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: prompt,
      config: { temperature: 0.1 } // Low temp for analytical consistency
    });

    const respText = responseStream.text.replace(/```json/g, '').replace(/```/g, '');
    const result = JSON.parse(respText);

    if (result.isToxic) {
       // Flag user asynchronously
       const user = await User.findById(userId);
       if (!user) return;

       user.violationCount = (user.violationCount || 0) + 1;
       user.violations = user.violations || [];
       user.violations.push({
           type: 'ai_flag',
           message: content,
           timestamp: new Date()
       });

       if (user.violationCount >= 3) {
           user.isShadowBanned = true;
       }

       await user.save();
       console.log(`[Moderation] User ${username} flagged for toxic message. Strike ${user.violationCount}`);
    }

  } catch (error) {
    console.error('AI Moderation failure (handled gracefully without blocking):', error);
  }
};
