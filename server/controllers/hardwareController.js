const HardwareLayer = require('../models/HardwareLayer');
const User = require('../models/User');
const UserGame = require('../models/UserGame');

const defaultHardwareSeed = [
  { componentType: 'ram', name: '4 GB DDR3/DDR4', performanceScore: 28 },
  { componentType: 'cpu', name: 'Intel Core i3-10100F', performanceScore: 52 },
  { componentType: 'cpu', name: 'Intel Core i5-10400F', performanceScore: 62 },
  { componentType: 'cpu', name: 'Intel Core i5-11400F', performanceScore: 67 },
  { componentType: 'cpu', name: 'Intel Core i5-12400F', performanceScore: 76 },
  { componentType: 'cpu', name: 'Intel Core i5-12600K', performanceScore: 84 },
  { componentType: 'cpu', name: 'Intel Core i5-13600K', performanceScore: 90 },
  { componentType: 'cpu', name: 'Intel Core i7-11700K', performanceScore: 80 },
  { componentType: 'cpu', name: 'Intel Core i7-12700K', performanceScore: 84 },
  { componentType: 'cpu', name: 'Intel Core i7-13700K', performanceScore: 93 },
  { componentType: 'cpu', name: 'Intel Core i9-12900K', performanceScore: 95 },
  { componentType: 'cpu', name: 'Intel Core i9-13900K', performanceScore: 98 },
  { componentType: 'cpu', name: 'AMD Ryzen 5 3600', performanceScore: 63 },
  { componentType: 'cpu', name: 'AMD Ryzen 5 5600X', performanceScore: 74 },
  { componentType: 'cpu', name: 'AMD Ryzen 5 7600', performanceScore: 81 },
  { componentType: 'cpu', name: 'AMD Ryzen 7 3700X', performanceScore: 70 },
  { componentType: 'cpu', name: 'AMD Ryzen 7 5800X', performanceScore: 84 },
  { componentType: 'cpu', name: 'AMD Ryzen 7 7800X3D', performanceScore: 96 },
  { componentType: 'cpu', name: 'AMD Ryzen 9 5900X', performanceScore: 90 },
  { componentType: 'cpu', name: 'AMD Ryzen 9 7950X', performanceScore: 99 },

  { componentType: 'gpu', name: 'NVIDIA GTX 1050 Ti', performanceScore: 40 },
  { componentType: 'gpu', name: 'NVIDIA GTX 1060 6GB', performanceScore: 48 },
  { componentType: 'gpu', name: 'NVIDIA GTX 1660 Super', performanceScore: 58 },
  { componentType: 'gpu', name: 'NVIDIA RTX 2060', performanceScore: 63 },
  { componentType: 'gpu', name: 'NVIDIA RTX 2070 Super', performanceScore: 69 },
  { componentType: 'gpu', name: 'NVIDIA RTX 3060', performanceScore: 74 },
  { componentType: 'gpu', name: 'NVIDIA RTX 3060 Ti', performanceScore: 78 },
  { componentType: 'gpu', name: 'NVIDIA RTX 3070', performanceScore: 82 },
  { componentType: 'gpu', name: 'NVIDIA RTX 3080', performanceScore: 89 },
  { componentType: 'gpu', name: 'NVIDIA RTX 4070 Super', performanceScore: 92 },
  { componentType: 'gpu', name: 'NVIDIA RTX 4080', performanceScore: 96 },
  { componentType: 'gpu', name: 'NVIDIA RTX 4090', performanceScore: 100 },
  { componentType: 'gpu', name: 'AMD RX 580', performanceScore: 45 },
  { componentType: 'gpu', name: 'AMD RX 5600 XT', performanceScore: 63 },
  { componentType: 'gpu', name: 'AMD RX 6600 XT', performanceScore: 71 },
  { componentType: 'gpu', name: 'AMD RX 6700 XT', performanceScore: 79 },
  { componentType: 'gpu', name: 'AMD RX 6800 XT', performanceScore: 87 },
  { componentType: 'gpu', name: 'AMD RX 7800 XT', performanceScore: 88 },
  { componentType: 'gpu', name: 'AMD RX 7900 XT', performanceScore: 94 },
  { componentType: 'gpu', name: 'AMD RX 7900 XTX', performanceScore: 98 },

  { componentType: 'ram', name: '8 GB DDR4', performanceScore: 45 },
  { componentType: 'ram', name: '12 GB DDR4', performanceScore: 58 },
  { componentType: 'ram', name: '16 GB DDR4', performanceScore: 70 },
  { componentType: 'ram', name: '24 GB DDR4/DDR5', performanceScore: 78 },
  { componentType: 'ram', name: '32 GB DDR4/DDR5', performanceScore: 86 },
  { componentType: 'ram', name: '64 GB DDR5', performanceScore: 96 },
];

const ensureHardwareCatalog = async () => {
  const existing = await HardwareLayer.find({}, { componentType: 1, name: 1 }).lean();
  const existingKeys = new Set(
    existing.map((item) => `${String(item.componentType || '').toLowerCase()}::${String(item.name || '').toLowerCase()}`)
  );

  const missing = defaultHardwareSeed.filter((item) => {
    const key = `${String(item.componentType || '').toLowerCase()}::${String(item.name || '').toLowerCase()}`;
    return !existingKeys.has(key);
  });

  if (missing.length > 0) {
    await HardwareLayer.insertMany(missing);
  }
};

const normalizeHardware = (h) => ({
  _id: h._id,
  type: h.componentType || h.type,
  name: h.name,
  performanceScore: h.performanceScore || 50,
});

const buildTips = ({ status, cpuScore, gpuScore, ramGb }) => {
  const tips = [];

  if (gpuScore < 65) tips.push('Lower shadow quality and anti-aliasing first to recover FPS.');
  if (cpuScore < 65) tips.push('Limit background apps and cap frame rate to reduce CPU spikes.');
  if (ramGb < 16) tips.push('Upgrade to 16GB+ RAM to reduce stutter and long texture loads.');

  if (status === 'Green') {
    tips.push('Use high textures with DLSS/FSR Quality mode for best visual balance.');
  } else if (status === 'Yellow') {
    tips.push('Start on medium preset and increase settings one by one while monitoring FPS.');
  } else {
    tips.push('Prefer 1080p low-medium settings, disable ray tracing, and lock to 45-60 FPS.');
  }

  tips.push('Gameplay strategy tip: learn one core build/playstyle first before experimenting with advanced mechanics.');
  return tips;
};

const platformProfiles = {
  pc: { label: 'PC (Desktop)', scoreDelta: 0, fpsMultiplier: 1 },
  steamdeck: { label: 'Steam Deck', scoreDelta: 4, fpsMultiplier: 0.88 },
  ps5: { label: 'PlayStation 5', scoreDelta: 10, fpsMultiplier: 1.05 },
  xboxseriesx: { label: 'Xbox Series X', scoreDelta: 9, fpsMultiplier: 1.03 },
  nintendoswitch: { label: 'Nintendo Switch', scoreDelta: -6, fpsMultiplier: 0.72 },
};

exports.getHardwareList = async (req, res) => {
  try {
    await ensureHardwareCatalog();
    const hardware = await HardwareLayer.find({}).sort({ componentType: 1, name: 1 }).lean();

    res.json({ hardware: hardware.map(normalizeHardware) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hardware list' });
  }
};

exports.checkCompatibility = async (req, res) => {
  try {
    const { rawgId } = req.params;
    const { cpuId, gpuId, ramGb = 16, platform = 'pc' } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.json({
        requiresAuth: true,
        message: 'Sign in to check compatibility against a tracked game in your library or watchlist.',
        status: 'Preview',
        tier: 'Public preview',
        game: { rawgId: Number(rawgId) || rawgId },
        tips: [
          'Browse the public hardware catalog below.',
          'Sign in to run a full compatibility analysis for your tracked games.',
        ],
      });
    }

    const userGame = await UserGame.findOne({
      userId,
      rawgId: Number(rawgId),
      status: { $in: ['library', 'watchlist'] },
    }).lean();

    if (!userGame) {
      return res.status(404).json({
        error: 'Selected game must exist in your library/watchlist before compatibility check.',
      });
    }

    const [cpu, gpu] = await Promise.all([
      HardwareLayer.findById(cpuId).lean(),
      HardwareLayer.findById(gpuId).lean(),
    ]);

    if (!cpu || !gpu) {
      return res.status(400).json({ error: 'Valid CPU and GPU are required' });
    }

    const cpuScore = Number(cpu.performanceScore || 50);
    const gpuScore = Number(gpu.performanceScore || 50);
    const ramScore = Math.min(Number(ramGb) * 4, 100);

    const platformKey = String(platform || 'pc').toLowerCase();
    const platformProfile = platformProfiles[platformKey] || platformProfiles.pc;

    const weighted = Math.max(
      0,
      Math.min(100, Math.round((cpuScore * 0.4 + gpuScore * 0.5 + ramScore * 0.1) + platformProfile.scoreDelta))
    );

    let status = 'Red';
    if (weighted >= 75) status = 'Green';
    else if (weighted >= 55) status = 'Yellow';

    const bottleneck = gpuScore < cpuScore ? 'GPU' : 'CPU';

    const estimatedFps = {
      low: Math.max(18, Math.round(weighted * 0.9 * platformProfile.fpsMultiplier)),
      medium: Math.max(15, Math.round(weighted * 0.75 * platformProfile.fpsMultiplier)),
      high: Math.max(12, Math.round(weighted * 0.58 * platformProfile.fpsMultiplier)),
    };

    const tips = buildTips({ status, cpuScore, gpuScore, ramGb: Number(ramGb) });

    return res.json({
      game: {
        rawgId: userGame.rawgId,
        title: userGame.title,
        coverUrl: userGame.coverUrl,
      },
      status,
      tier: status === 'Green' ? 'Great Fit' : status === 'Yellow' ? 'Playable with tuning' : 'Needs upgrades',
      bottleneck,
      details: {
        cpu: normalizeHardware(cpu),
        gpu: normalizeHardware(gpu),
        ramGb: Number(ramGb),
        platform: {
          key: platformKey,
          label: platformProfile.label,
        },
        cpuRank: cpuScore,
        gpuRank: gpuScore,
        combinedScore: weighted,
      },
      estimatedFps,
      tips,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check compatibility' });
  }
};

exports.saveHardwareProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { profile } = req.body;

    await User.findByIdAndUpdate(
      userId,
      { $set: { hardwareProfile: profile || {} } },
      { new: true, strict: false }
    );

    res.json({ message: 'Hardware profile saved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save hardware profile' });
  }
};
