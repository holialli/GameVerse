const HardwareLayer = require('../models/HardwareLayer');
const User = require('../models/User');
const UserGame = require('../models/UserGame');

const defaultHardwareSeed = [
  { componentType: 'cpu', name: 'Intel Core i5-10400F', performanceScore: 62 },
  { componentType: 'cpu', name: 'Intel Core i7-12700K', performanceScore: 84 },
  { componentType: 'cpu', name: 'AMD Ryzen 5 5600X', performanceScore: 74 },
  { componentType: 'cpu', name: 'AMD Ryzen 7 7800X3D', performanceScore: 93 },
  { componentType: 'gpu', name: 'NVIDIA GTX 1660 Super', performanceScore: 58 },
  { componentType: 'gpu', name: 'NVIDIA RTX 3060', performanceScore: 74 },
  { componentType: 'gpu', name: 'NVIDIA RTX 4070 Super', performanceScore: 92 },
  { componentType: 'gpu', name: 'AMD RX 6600 XT', performanceScore: 71 },
  { componentType: 'gpu', name: 'AMD RX 7800 XT', performanceScore: 88 },
];

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

exports.getHardwareList = async (req, res) => {
  try {
    let hardware = await HardwareLayer.find({}).lean();

    if (!hardware.length) {
      await HardwareLayer.insertMany(defaultHardwareSeed);
      hardware = await HardwareLayer.find({}).lean();
    }

    res.json({ hardware: hardware.map(normalizeHardware) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hardware list' });
  }
};

exports.checkCompatibility = async (req, res) => {
  try {
    const { rawgId } = req.params;
    const { cpuId, gpuId, ramGb = 16 } = req.query;

    const userGame = await UserGame.findOne({
      userId: req.user.id,
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

    const weighted = Math.round(cpuScore * 0.4 + gpuScore * 0.5 + ramScore * 0.1);

    let status = 'Red';
    if (weighted >= 75) status = 'Green';
    else if (weighted >= 55) status = 'Yellow';

    const bottleneck = gpuScore < cpuScore ? 'GPU' : 'CPU';

    const estimatedFps = {
      low: Math.max(24, Math.round(weighted * 0.9)),
      medium: Math.max(20, Math.round(weighted * 0.75)),
      high: Math.max(15, Math.round(weighted * 0.58)),
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
