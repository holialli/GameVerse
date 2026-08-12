// Deliberately regex-only, no AI - keeps this feature's cost at exactly $0
// regardless of scale (explicit choice over using the existing Gemini
// integration, which is reserved for the AI Discovery/chat features).
// Tradeoff: lower match quality on inconsistently-formatted RAWG entries
// than an AI parser would give, accepted in exchange for zero cost ever.

const stripHtml = (value) => String(value || '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]*>/g, '\n')
  .replace(/\r/g, '');

const CPU_PATTERN = /(?:Processor|CPU)[:\s]*([^\n]+)/i;
const GPU_PATTERN = /(?:Graphics|Video Card|GPU)[:\s]*([^\n]+)/i;
const RAM_PATTERN = /(?:Memory|RAM)[:\s]*(\d+)\s*GB/i;

const parseRequirementTier = (rawText) => {
  if (!rawText) return null;
  const text = stripHtml(rawText);

  const cpuMatch = text.match(CPU_PATTERN);
  const gpuMatch = text.match(GPU_PATTERN);
  const ramMatch = text.match(RAM_PATTERN);

  const cpuModel = cpuMatch ? cpuMatch[1].trim() : null;
  const gpuModel = gpuMatch ? gpuMatch[1].trim() : null;
  const ramGb = ramMatch ? Number(ramMatch[1]) : null;

  if (!cpuModel && !gpuModel && !ramGb) return null;

  return { cpuModel, gpuModel, ramGb, raw: rawText };
};

// pcRequirements: { minimum, recommended } as extracted by
// gameController.normalizeRawgItem - free-text/HTML strings from RAWG.
const parseRequirements = (pcRequirements) => {
  if (!pcRequirements) return null;

  const minimum = parseRequirementTier(pcRequirements.minimum);
  const recommended = parseRequirementTier(pcRequirements.recommended);

  if (!minimum && !recommended) return null;
  return { minimum, recommended };
};

module.exports = { parseRequirements };
