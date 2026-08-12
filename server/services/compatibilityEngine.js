const mongoose = require('mongoose');
const GameRequirements = require('../models/GameRequirements');
const { matchComponent } = require('../utils/hardwareMatcher');
const { buildComponentShopLinks } = require('../utils/affiliateLinks');

const platformProfiles = {
  pc: { label: 'PC (Desktop)', scoreDelta: 0, fpsMultiplier: 1 },
  steamdeck: { label: 'Steam Deck', scoreDelta: 4, fpsMultiplier: 0.88 },
  ps5: { label: 'PlayStation 5', scoreDelta: 10, fpsMultiplier: 1.05 },
  xboxseriesx: { label: 'Xbox Series X', scoreDelta: 9, fpsMultiplier: 1.03 },
  nintendoswitch: { label: 'Nintendo Switch', scoreDelta: -6, fpsMultiplier: 0.72 },
};

const buildTips = ({ status, cpuScore, gpuScore, ramGb }) => {
  const tips = [];
  const tipLinks = [];

  if (gpuScore < 65) tips.push('Lower shadow quality and anti-aliasing first to recover FPS.');
  if (gpuScore < 55) tipLinks.push(...buildComponentShopLinks('gpu'));

  if (cpuScore < 65) tips.push('Limit background apps and cap frame rate to reduce CPU spikes.');
  if (cpuScore < 55) tipLinks.push(...buildComponentShopLinks('cpu'));

  if (ramGb < 16) {
    tips.push('Upgrade to 16GB+ RAM to reduce stutter and long texture loads.');
    tipLinks.push(...buildComponentShopLinks('ram'));
  }

  if (status === 'Green') {
    tips.push('Use high textures with DLSS/FSR Quality mode for best visual balance.');
  } else if (status === 'Yellow') {
    tips.push('Start on medium preset and increase settings one by one while monitoring FPS.');
  } else {
    tips.push('Prefer 1080p low-medium settings, disable ray tracing, and lock to 45-60 FPS.');
  }

  tips.push('Gameplay strategy tip: learn one core build/playstyle first before experimenting with advanced mechanics.');
  return { tips, tipLinks };
};

const computeGenericFit = ({ cpuScore, gpuScore, ramGb, platform }) => {
  const platformKey = String(platform || 'pc').toLowerCase();
  const platformProfile = platformProfiles[platformKey] || platformProfiles.pc;
  const ramScore = Math.min(Number(ramGb) * 4, 100);

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

  const { tips, tipLinks } = buildTips({ status, cpuScore, gpuScore, ramGb: Number(ramGb) });

  return {
    status,
    tier: status === 'Green' ? 'Great Fit' : status === 'Yellow' ? 'Playable with tuning' : 'Needs upgrades',
    bottleneck,
    platform: { key: platformKey, label: platformProfile.label },
    cpuRank: cpuScore,
    gpuRank: gpuScore,
    combinedScore: weighted,
    estimatedFps,
    tips,
    tipLinks,
  };
};

const resolveTier = async (tier) => {
  if (!tier) return null;
  const [cpuMatch, gpuMatch] = await Promise.all([
    tier.cpuModel ? matchComponent(tier.cpuModel, 'cpu') : null,
    tier.gpuModel ? matchComponent(tier.gpuModel, 'gpu') : null,
  ]);
  return { cpuMatch, gpuMatch, ramGb: tier.ramGb || null };
};

const meetsTier = (tier, cpuScore, gpuScore, ramGb) => {
  if (!tier) return null;
  const cpuOk = !tier.cpuMatch || cpuScore >= tier.cpuMatch.performanceScore;
  const gpuOk = !tier.gpuMatch || gpuScore >= tier.gpuMatch.performanceScore;
  const ramOk = !tier.ramGb || Number(ramGb) >= tier.ramGb;
  return cpuOk && gpuOk && ramOk;
};

// Never throws - a DB hiccup or missing data here should degrade to "not
// available" rather than break the whole compatibility check.
const computeGameSpecificFit = async ({ rawgId, cpuScore, gpuScore, ramGb }) => {
  try {
    if (!rawgId) return { available: false };
    // Degrade gracefully (not just "on error") if Mongo isn't connected -
    // avoids a hung/buffered query, same graceful-degradation philosophy
    // used for optional Redis elsewhere in this codebase.
    if (mongoose.connection.readyState !== 1) return { available: false };

    const reqs = await GameRequirements.findOne({ rawgId: Number(rawgId) }).lean();
    if (!reqs) return { available: false };

    const [minimum, recommended] = await Promise.all([resolveTier(reqs.minimum), resolveTier(reqs.recommended)]);

    const hasAnyMatch = !!(minimum?.cpuMatch || minimum?.gpuMatch || recommended?.cpuMatch || recommended?.gpuMatch);
    if (!hasAnyMatch) return { available: false };

    const bestConfidence = Math.max(
      minimum?.cpuMatch?.confidence || 0,
      minimum?.gpuMatch?.confidence || 0,
      recommended?.cpuMatch?.confidence || 0,
      recommended?.gpuMatch?.confidence || 0
    );

    return {
      available: true,
      meetsMinimum: meetsTier(minimum, cpuScore, gpuScore, ramGb),
      meetsRecommended: meetsTier(recommended, cpuScore, gpuScore, ramGb),
      matchConfidence: bestConfidence >= 0.5 ? 'high' : 'low',
    };
  } catch (err) {
    return { available: false };
  }
};

// Shared by the internal (library-gated) endpoint and the public API - the
// math is computed once here so the two paths never drift apart.
const computeCompatibility = async ({ rawgId, cpuScore, gpuScore, ramGb, platform }) => {
  const generic = computeGenericFit({ cpuScore, gpuScore, ramGb, platform });
  const gameSpecific = await computeGameSpecificFit({ rawgId, cpuScore, gpuScore, ramGb });
  return { ...generic, gameSpecific };
};

module.exports = { computeCompatibility, platformProfiles };
