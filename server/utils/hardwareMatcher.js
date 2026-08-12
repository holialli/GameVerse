const HardwareLayer = require('../models/HardwareLayer');

// Hand-rolled token-overlap matching, no new dependency - the HardwareLayer
// catalog is small (well under a thousand entries), so an in-memory Jaccard
// comparison per lookup is cheap. Only reach for a fuzzy-match library if
// this proves insufficient in practice.
const NOISE_WORDS = new Set(['or', 'better', 'higher', 'equivalent', 'equal', 'above', 'greater', 'and', 'up']);

const normalize = (str) => String(str || '')
  .toLowerCase()
  .replace(/\(r\)|\(tm\)|®|™/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const tokenize = (str) => normalize(str).split(' ').filter((t) => t && !NOISE_WORDS.has(t));

const jaccardSimilarity = (tokensA, tokensB) => {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  setA.forEach((token) => { if (setB.has(token)) intersection += 1; });

  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
};

const MATCH_THRESHOLD = 0.35;

// Returns the best HardwareLayer match (plus a confidence score) for a
// free-text component name, or null if nothing clears the confidence bar -
// callers should fall back to generic scoring rather than trust a bad guess.
const matchComponent = async (modelString, componentType) => {
  if (!modelString) return null;

  const queryTokens = tokenize(modelString);
  if (queryTokens.length === 0) return null;

  const candidates = await HardwareLayer.find({ componentType }).lean();
  let best = null;
  let bestScore = 0;

  candidates.forEach((candidate) => {
    const score = jaccardSimilarity(queryTokens, tokenize(candidate.name));
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  });

  if (!best || bestScore < MATCH_THRESHOLD) return null;
  return { ...best, confidence: bestScore };
};

module.exports = { matchComponent };
