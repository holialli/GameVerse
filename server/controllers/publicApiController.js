const { matchComponent } = require('../utils/hardwareMatcher');
const { computeCompatibility } = require('../services/compatibilityEngine');

// Stateless w.r.t. the end user (no UserGame ownership check - that's an
// internal-only concept). Callers identify components by free-text name
// since external developers have no visibility into our internal
// HardwareLayer catalog IDs.
exports.checkCompatibility = async (req, res) => {
  try {
    const { rawgId, cpu, gpu, ramGb, platform } = req.validatedBody;

    const [cpuMatch, gpuMatch] = await Promise.all([
      matchComponent(cpu, 'cpu'),
      matchComponent(gpu, 'gpu'),
    ]);

    if (!cpuMatch || !gpuMatch) {
      return res.status(400).json({
        error: 'Could not confidently match the provided CPU/GPU names against the hardware catalog.',
        cpuMatched: !!cpuMatch,
        gpuMatched: !!gpuMatch,
      });
    }

    const result = await computeCompatibility({
      rawgId: rawgId ? Number(rawgId) : null,
      cpuScore: cpuMatch.performanceScore,
      gpuScore: gpuMatch.performanceScore,
      ramGb: Number(ramGb) || 16,
      platform: platform || 'pc',
    });

    res.json({
      matched: {
        cpu: { name: cpuMatch.name, confidence: cpuMatch.confidence },
        gpu: { name: gpuMatch.name, confidence: gpuMatch.confidence },
      },
      status: result.status,
      tier: result.tier,
      bottleneck: result.bottleneck,
      estimatedFps: result.estimatedFps,
      gameSpecific: result.gameSpecific,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check compatibility' });
  }
};
