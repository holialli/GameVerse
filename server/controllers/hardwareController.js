const HardwareLayer = require('../models/HardwareLayer');
const User = require('../models/User');
const UserGame = require('../models/UserGame');
const { computeCompatibility } = require('../services/compatibilityEngine');

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

  // Older/budget hardware - the list above skews recent/high-end, which is
  // exactly wrong for matching older games' "minimum" requirements text.
  { componentType: 'cpu', name: 'Intel Core i3-4160', performanceScore: 30 },
  { componentType: 'cpu', name: 'Intel Core i5-4460', performanceScore: 38 },
  { componentType: 'cpu', name: 'Intel Core i5-6500', performanceScore: 42 },
  { componentType: 'cpu', name: 'Intel Core i5-7400', performanceScore: 45 },
  { componentType: 'cpu', name: 'Intel Core i7-4770K', performanceScore: 46 },
  { componentType: 'cpu', name: 'Intel Core i5-8400', performanceScore: 55 },
  { componentType: 'cpu', name: 'Intel Core i5-9400F', performanceScore: 58 },
  { componentType: 'cpu', name: 'AMD FX-8350', performanceScore: 28 },
  { componentType: 'cpu', name: 'AMD Athlon 200GE', performanceScore: 25 },
  { componentType: 'cpu', name: 'AMD Ryzen 3 1200', performanceScore: 40 },
  { componentType: 'cpu', name: 'AMD Ryzen 3 3200G', performanceScore: 44 },
  { componentType: 'cpu', name: 'AMD Ryzen 5 2600', performanceScore: 56 },

  { componentType: 'gpu', name: 'NVIDIA GT 1030', performanceScore: 18 },
  { componentType: 'gpu', name: 'NVIDIA GTX 750 Ti', performanceScore: 22 },
  { componentType: 'gpu', name: 'NVIDIA GTX 950', performanceScore: 28 },
  { componentType: 'gpu', name: 'NVIDIA GTX 960', performanceScore: 32 },
  { componentType: 'gpu', name: 'NVIDIA GTX 970', performanceScore: 38 },
  { componentType: 'gpu', name: 'NVIDIA GTX 1050', performanceScore: 34 },
  { componentType: 'gpu', name: 'NVIDIA GTX 1650', performanceScore: 42 },
  { componentType: 'gpu', name: 'AMD RX 460', performanceScore: 26 },
  { componentType: 'gpu', name: 'AMD RX 550', performanceScore: 27 },
  { componentType: 'gpu', name: 'AMD RX 570', performanceScore: 40 },
  { componentType: 'gpu', name: 'Intel UHD Graphics 630 (Integrated)', performanceScore: 12 },

  { componentType: 'ram', name: '2 GB DDR3', performanceScore: 12 },
  { componentType: 'ram', name: '4 GB DDR3', performanceScore: 22 },
  { componentType: 'ram', name: '6 GB DDR3/DDR4', performanceScore: 36 },
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

    const result = await computeCompatibility({
      rawgId: Number(rawgId),
      cpuScore,
      gpuScore,
      ramGb: Number(ramGb),
      platform,
    });

    return res.json({
      game: {
        rawgId: userGame.rawgId,
        title: userGame.title,
        coverUrl: userGame.coverUrl,
      },
      status: result.status,
      tier: result.tier,
      bottleneck: result.bottleneck,
      details: {
        cpu: normalizeHardware(cpu),
        gpu: normalizeHardware(gpu),
        ramGb: Number(ramGb),
        platform: result.platform,
        cpuRank: result.cpuRank,
        gpuRank: result.gpuRank,
        combinedScore: result.combinedScore,
      },
      estimatedFps: result.estimatedFps,
      tips: result.tips,
      tipLinks: result.tipLinks,
      gameSpecific: result.gameSpecific,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check compatibility' });
  }
};

const PROFILE_LIMITS = { free: 1, premium: 5 };

exports.listHardwareProfiles = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('hardwareProfiles subscriptionTier').lean();
    res.json({
      profiles: user?.hardwareProfiles || [],
      limit: PROFILE_LIMITS[user?.subscriptionTier || 'free'],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load hardware profiles' });
  }
};

exports.createHardwareProfile = async (req, res) => {
  try {
    const { name, cpuId, gpuId, ramGb, platform } = req.body;
    if (!name) return res.status(400).json({ error: 'Profile name is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const limit = PROFILE_LIMITS[user.subscriptionTier || 'free'];
    if (user.hardwareProfiles.length >= limit) {
      return res.status(403).json({
        error: `Your plan allows up to ${limit} saved hardware profile${limit === 1 ? '' : 's'}. Upgrade to Premium for more.`,
        limit,
      });
    }

    user.hardwareProfiles.push({
      name,
      cpuId,
      gpuId,
      ramGb: ramGb || 16,
      platform: platform || 'pc',
      isDefault: user.hardwareProfiles.length === 0,
    });
    await user.save();

    res.status(201).json({ message: 'Hardware profile saved', profiles: user.hardwareProfiles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save hardware profile' });
  }
};

exports.updateHardwareProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { name, cpuId, gpuId, ramGb, platform, isDefault } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profile = user.hardwareProfiles.id(profileId);
    if (!profile) return res.status(404).json({ error: 'Hardware profile not found' });

    if (name !== undefined) profile.name = name;
    if (cpuId !== undefined) profile.cpuId = cpuId;
    if (gpuId !== undefined) profile.gpuId = gpuId;
    if (ramGb !== undefined) profile.ramGb = ramGb;
    if (platform !== undefined) profile.platform = platform;
    if (isDefault) {
      user.hardwareProfiles.forEach((p) => { p.isDefault = String(p._id) === String(profile._id); });
    }

    await user.save();
    res.json({ message: 'Hardware profile updated', profiles: user.hardwareProfiles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hardware profile' });
  }
};

exports.deleteHardwareProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.hardwareProfiles.pull({ _id: profileId });
    await user.save();

    res.json({ message: 'Hardware profile deleted', profiles: user.hardwareProfiles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete hardware profile' });
  }
};
